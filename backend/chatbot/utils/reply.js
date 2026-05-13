import { createRequire } from 'module';
import { detectIntent } from './smartIntent.js';
import { detectLanguage } from './language.js';
import { getLastIntent, setLastIntent } from './context.js';
import { fetchN8nReply } from './n8nClient.js';

const require = createRequire(import.meta.url);
const faq = require('../data/faq.json');
const DYNAMIC_INTENTS = new Set(['weather', 'route', 'traffic']);

function normalizeText(value = '') {
  return value.toLowerCase().trim();
}

function extractLocation(message = '') {
  const knownLocations = [
    'kedarnath',
    'badrinath',
    'gangotri',
    'yamunotri',
    'haridwar',
    'rishikesh',
    'dehradun',
    'gaurikund',
    'joshimath',
    'uttarkashi',
  ];
  const lower = normalizeText(message);
  const match = knownLocations.find((loc) => lower.includes(loc));
  return match || null;
}

function resolveDynamicIntent(detectedIntent, message) {
  if (detectedIntent === 'weather') return 'weather';
  if (detectedIntent.includes('route')) return 'route';
  if (detectedIntent === 'traffic') return 'traffic';

  const lower = normalizeText(message);
  if (lower.includes('traffic') || lower.includes('jam')) return 'traffic';
  if (lower.includes('weather') || lower.includes('mausam')) return 'weather';
  if (lower.includes('route') || lower.includes('rasta')) return 'route';

  return null;
}

function resolveOfflineFallbackIntent(dynamicIntent, detectedIntent) {
  if (dynamicIntent === 'weather') return 'weather';
  if (dynamicIntent === 'traffic') return 'safety';
  if (dynamicIntent === 'route') {
    if (detectedIntent && detectedIntent.includes('route')) {
      return detectedIntent;
    }
    return 'transport';
  }
  return detectedIntent;
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
 * Full pipeline: fuzzy intent → context fallback → FAQ in detected language.
 */
export async function buildReply(message, userId) {
  const lang = detectLanguage(message);
  const detected = detectIntent(message);

  let intent = detected;
  if (detected === 'unknown') {
    const last = getLastIntent(userId);
    if (last) intent = last;
  }

  const dynamicIntent = resolveDynamicIntent(intent, message);
  if (dynamicIntent && DYNAMIC_INTENTS.has(dynamicIntent)) {
    const n8nReply = await fetchN8nReply({
      message,
      intent: dynamicIntent,
      location: extractLocation(message),
      language: lang,
    });
    if (n8nReply) {
      if (detected !== 'unknown') {
        setLastIntent(userId, detected);
      }
      return n8nReply;
    }
    intent = resolveOfflineFallbackIntent(dynamicIntent, intent);
  }

  const reply = pickReply(intent, lang);

  if (detected !== 'unknown') {
    setLastIntent(userId, detected);
  }

  return { reply, intent };
}
