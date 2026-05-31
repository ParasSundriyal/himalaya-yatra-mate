import { createRequire } from 'module';
import { detectIntent } from './smartIntent.js';
import { detectLanguage } from './language.js';
import { getLastIntent, setLastIntent } from './context.js';
import { runDhamSarthi } from '../dhamSarthiAgent.js';
import { executeTool } from '../tools.js';

const require = createRequire(import.meta.url);
const faq = require('../data/faq.json');

function normalizeText(value = '') {
  return value.toLowerCase().trim();
}

function extractLocation(message = '') {
  const knownLocations = [
    'kedarnath', 'badrinath', 'gangotri', 'yamunotri',
    'haridwar', 'rishikesh', 'dehradun', 'gaurikund',
    'joshimath', 'uttarkashi',
  ];
  const lower = normalizeText(message);
  return knownLocations.find((loc) => lower.includes(loc)) || null;
}

function pickReply(intent, lang) {
  const entry = faq[intent];
  if (!entry) {
    const unk = faq.unknown || {};
    return unk[lang] || unk.en || 'Sorry, I could not help with that.';
  }
  return entry[lang] || entry.en || faq.unknown?.[lang] || faq.unknown?.en;
}

function isLiveStatusQuery(message = '') {
  const lower = normalizeText(message);
  const keys = ['weather', 'temperature', 'crowd', 'rush', 'bheed', 'mausam'];
  return keys.some((k) => lower.includes(k));
}

function buildLiveStatusText(data) {
  const cards = Array.isArray(data?.cards) ? data.cards : [];
  if (!cards.length) return null;
  const lines = cards.map((c) => {
    const crowd = c?.crowd?.level || 'Medium';
    const wait = c?.waitTimeMins != null ? `${c.waitTimeMins} min` : 'N/A';
    const temp = c?.temperatureC != null ? `${Math.round(c.temperatureC)}°C` : 'N/A';
    return `${c.dham}: Crowd ${crowd}, Temp ${temp}, Wait ${wait}`;
  });
  return `Latest live status:\n${lines.join('\n')}`;
}

/**
 * Full pipeline: AI Agent → FAQ fallback.
 */
export async function buildReply(message, userId, userToken = '') {
  const lang = detectLanguage(message);
  const detected = detectIntent(message);

  let intent = detected;
  if (detected === 'unknown') {
    const last = getLastIntent(userId);
    if (last) intent = last;
  }

  // DhamSarthi JSON assistant (Groq)
  try {
    const agentReply = await runDhamSarthi({
      message,
      userId,
      userToken,
      language: lang,
    });

    if (agentReply?.structured) {
      if (detected !== 'unknown') {
        setLastIntent(userId, detected);
      }
      return agentReply;
    }
  } catch (error) {
    console.error('[buildReply] DhamSarthi error, falling back to FAQ:', error.message);
  }

  // Deterministic fallback for crowd/weather so users still get live data
  if (isLiveStatusQuery(message)) {
    const live = await executeTool('get_dashboard_live', {}, { userId, userToken });
    const liveText = buildLiveStatusText(live);
    if (liveText) {
      return {
        reply: liveText,
        intent: 'crowd_status',
        source: 'tool_fallback',
        structured: {
          intent: 'crowd_status',
          title: 'Live Dham Status',
          summary: liveText,
          icon: 'crowd',
          priority: 'normal',
          data: { status: liveText },
          actions: ['Weather Forecast', 'Temple Timings', 'Route Guidance', 'Emergency Help'],
        },
      };
    }
  }

  // Fallback to offline FAQ
  const reply = pickReply(intent, lang);

  if (detected !== 'unknown') {
    setLastIntent(userId, detected);
  }

  return {
    reply,
    intent: intent === 'unknown' ? 'general_chat' : intent,
    source: 'faq_fallback',
    structured: {
      intent: 'general_chat',
      title: 'DhamSarthi AI',
      summary: reply,
      icon: 'info',
      priority: 'normal',
      data: {},
      actions: ['Weather Forecast', 'Kedarnath Route', 'Temple Timings', 'Emergency Help'],
    },
  };
}
