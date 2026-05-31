import axios from 'axios';

const FIRECRAWL_URL = process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev/v1/search';
const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary';

const DHAM_WIKI = {
  kedarnath: 'Kedarnath_Temple',
  badrinath: 'Badrinath',
  gangotri: 'Gangotri',
  yamunotri: 'Yamunotri',
};

function normalizeQuery(query = '') {
  return String(query).trim();
}

function extractDham(query = '') {
  const lower = query.toLowerCase();
  return Object.keys(DHAM_WIKI).find((d) => lower.includes(d)) || null;
}

async function searchFirecrawl(query) {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) return null;

  const { data } = await axios.post(
    FIRECRAWL_URL,
    {
      query: `${query} Char Dham Yatra Uttarakhand`,
      limit: 3,
      scrapeOptions: { formats: ['markdown'] },
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 20000,
    },
  );

  const items = data?.data || data?.results || [];
  const results = items.map((r) => ({
    title: r.title || r.metadata?.title || 'Result',
    url: r.url || r.metadata?.sourceURL || r.link || '',
    snippet: (r.markdown || r.description || r.metadata?.description || '').slice(0, 600),
  }));

  return results.length ? { provider: 'firecrawl', results } : null;
}

async function searchWikipedia(query) {
  const dham = extractDham(query);
  if (!dham) return null;

  try {
    const title = DHAM_WIKI[dham];
    const { data } = await axios.get(`${WIKI_SUMMARY}/${encodeURIComponent(title)}`, {
      timeout: 10000,
      headers: { 'User-Agent': 'HimalayaYatraMate/1.0 (Char Dham chatbot)' },
    });

    if (!data?.extract) return null;

    return {
      provider: 'wikipedia',
      results: [
        {
          title: data.title || title,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title}`,
          snippet: data.extract,
        },
      ],
    };
  } catch {
    return null;
  }
}

async function searchDuckDuckGo(query) {
  const { data } = await axios.get('https://api.duckduckgo.com/', {
    params: {
      q: `${query} Char Dham Yatra`,
      format: 'json',
      no_redirect: 1,
      skip_disambig: 1,
    },
    timeout: 10000,
    headers: { 'User-Agent': 'HimalayaYatraMate/1.0' },
  });

  const results = [];

  if (data?.AbstractText) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL || '',
      snippet: data.AbstractText,
    });
  }

  const topics = Array.isArray(data?.RelatedTopics) ? data.RelatedTopics : [];
  for (const topic of topics) {
    if (topic.Text && topic.FirstURL) {
      results.push({
        title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 80),
        url: topic.FirstURL,
        snippet: topic.Text,
      });
    } else if (Array.isArray(topic.Topics)) {
      for (const sub of topic.Topics.slice(0, 2)) {
        if (sub.Text && sub.FirstURL) {
          results.push({
            title: sub.Text.split(' - ')[0] || sub.Text.slice(0, 80),
            url: sub.FirstURL,
            snippet: sub.Text,
          });
        }
      }
    }
    if (results.length >= 4) break;
  }

  return results.length ? { provider: 'duckduckgo', results: results.slice(0, 4) } : null;
}

/**
 * Multi-provider web search for chatbot (no key required — uses Wikipedia + DuckDuckGo fallbacks).
 */
export async function runWebSearch(query) {
  const q = normalizeQuery(query);
  if (!q) {
    return { error: 'Search query is required.' };
  }

  const providers = [];

  try {
    const firecrawl = await searchFirecrawl(q);
    if (firecrawl) {
      return { success: true, query: q, ...firecrawl };
    }
  } catch (err) {
    providers.push(`firecrawl: ${err.message}`);
  }

  try {
    const wiki = await searchWikipedia(q);
    if (wiki) {
      return { success: true, query: q, ...wiki };
    }
  } catch (err) {
    providers.push(`wikipedia: ${err.message}`);
  }

  try {
    const ddg = await searchDuckDuckGo(q);
    if (ddg) {
      return { success: true, query: q, ...ddg };
    }
  } catch (err) {
    providers.push(`duckduckgo: ${err.message}`);
  }

  return {
    error: 'Web search returned no results.',
    query: q,
    details: providers.length ? providers.join('; ') : 'All providers returned empty.',
    hint: 'Set FIRECRAWL_API_KEY in .env for richer search results.',
  };
}
