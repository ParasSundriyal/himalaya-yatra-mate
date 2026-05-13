import axios from 'axios';
import { load } from 'cheerio';
import cron from 'node-cron';
import admin from 'firebase-admin';
import { getFirestoreDb } from './firebaseAdmin.js';

const SOURCE = 'badrinath-kedarnath.gov.in';
const URL = 'https://badrinath-kedarnath.gov.in';
const CACHE_DOC = 'latest';
const THREE_H_MS = 3 * 60 * 60 * 1000;

const DHAM_KEYS = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];

function emptyCounts() {
  return {
    yamunotri: null,
    gangotri: null,
    kedarnath: null,
    badrinath: null,
    scrapedAt: new Date().toISOString(),
    source: SOURCE,
  };
}

function parseCountsFromText(text) {
  const lower = text.toLowerCase();
  const out = { ...emptyCounts() };
  const patterns = [
    [/yamunotri[^\d]{0,80}(\d{3,6})/i, 'yamunotri'],
    [/gangotri[^\d]{0,80}(\d{3,6})/i, 'gangotri'],
    [/kedarnath[^\d]{0,80}(\d{3,6})/i, 'kedarnath'],
    [/badrinath[^\d]{0,80}(\d{3,6})/i, 'badrinath'],
  ];
  for (const [re, key] of patterns) {
    const m = lower.match(re);
    if (m) {
      out[key] = parseInt(m[1], 10);
    }
  }
  return out;
}

function parseTable($) {
  const out = { ...emptyCounts() };
  $('table').each((_, table) => {
    $(table)
      .find('tr')
      .each((__, tr) => {
        const rowText = $(tr).text().toLowerCase();
        const nums = $(tr)
          .find('td')
          .map((i, td) => $(td).text().trim())
          .get()
          .map((t) => t.replace(/,/g, ''))
          .filter((t) => /^\d{3,8}$/.test(t));
        for (const key of DHAM_KEYS) {
          if (rowText.includes(key) && nums.length) {
            const n = parseInt(nums[nums.length - 1], 10);
            if (!Number.isNaN(n)) {
              out[key] = n;
            }
          }
        }
      });
  });
  return out;
}

export async function scrapePilgrimCounts() {
  const base = emptyCounts();
  try {
    const { data: html } = await axios.get(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChardhamApp/1.0)',
        Accept: 'text/html',
      },
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
    });
    if (typeof html !== 'string') {
      return base;
    }
    const $ = load(html);
    const fromTable = parseTable($);
    let merged = { ...base, ...fromTable, scrapedAt: new Date().toISOString() };
    const anyNumber = DHAM_KEYS.some((k) => merged[k] != null);
    if (!anyNumber) {
      const fromRegex = parseCountsFromText($.root().text());
      merged = { ...merged, ...fromRegex, scrapedAt: new Date().toISOString() };
    }
    return merged;
  } catch (e) {
    console.error('[scraper] scrapePilgrimCounts failed:', e.message);
    return base;
  }
}

export async function getCachedScrapeCounts() {
  const db = getFirestoreDb();
  const now = Date.now();
  if (db) {
    try {
      const doc = await db.collection('scrape_cache').doc(CACHE_DOC).get();
      if (doc.exists) {
        const data = doc.data();
        const scrapedAt = data.scrapedAt;
        const d = scrapedAt ? new Date(scrapedAt).getTime() : 0;
        if (d && now - d < THREE_H_MS) {
          return {
            yamunotri: data.yamunotri ?? null,
            gangotri: data.gangotri ?? null,
            kedarnath: data.kedarnath ?? null,
            badrinath: data.badrinath ?? null,
            scrapedAt: data.scrapedAt,
            source: data.source || SOURCE,
          };
        }
      }
    } catch (e) {
      console.warn('[scraper] cache read failed', e.message);
    }
  }

  const fresh = await scrapePilgrimCounts();
  const hasData = DHAM_KEYS.some((k) => fresh[k] != null);
  if (hasData && db) {
    try {
      await db.collection('scrape_cache').doc(CACHE_DOC).set(fresh, { merge: true });
    } catch (e) {
      console.error('[scraper] cache write failed', e.message);
    }
  }
  return fresh;
}

async function cronScrapeJob() {
  try {
    const data = await scrapePilgrimCounts();
    const hasData = DHAM_KEYS.some((k) => data[k] != null);
    if (!hasData) {
      console.error('[scraper] cron: scrape returned no numbers');
      return;
    }
    const db = getFirestoreDb();
    if (db) {
      await db.collection('scrape_cache').doc(CACHE_DOC).set(data, { merge: true });
    }
    console.log('[scraper] cron: cached pilgrim counts', data.scrapedAt);
  } catch (e) {
    console.error('[scraper] cron error:', e.message);
  }
}

let scraperCronStarted = false;

export function scheduleScraperCron() {
  if (scraperCronStarted) return;
  scraperCronStarted = true;
  const hours = parseInt(process.env.SCRAPE_INTERVAL_HOURS || '2', 10) || 2;
  const cronExpr = hours === 2 ? '0 */2 * * *' : `0 */${hours} * * *`;
  cron.schedule(cronExpr, () => {
    void cronScrapeJob();
  });
  console.log(`[scraper] cron scheduled (${cronExpr})`);
}
