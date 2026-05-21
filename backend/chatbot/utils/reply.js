import { createRequire } from 'module';
import { detectIntent } from './smartIntent.js';
import { detectLanguage } from './language.js';
import { getLastIntent, setLastIntent } from './context.js';
import { runAgent } from '../aiAgent.js';

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

  // Try the coded AI agent first
  try {
    const agentReply = await runAgent({
      message,
      userId,
      userToken,
      language: lang,
    });

    if (agentReply && agentReply.reply) {
      if (detected !== 'unknown') {
        setLastIntent(userId, detected);
      }
      return agentReply;
    }
  } catch (error) {
    // AI agent failed — fall back to offline FAQ
    console.error('[buildReply] AI Agent error, falling back to FAQ:', error.message);
  }

  // Fallback to offline FAQ
  const reply = pickReply(intent, lang);

  if (detected !== 'unknown') {
    setLastIntent(userId, detected);
  }

  return { reply, intent, source: 'faq_fallback' };
}
