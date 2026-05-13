import { createRequire } from 'module';
import stringSimilarity from 'string-similarity';

const require = createRequire(import.meta.url);
const intentMap = require('../data/intentMap.json');

const THRESHOLD = 0.4;

function normalizeText(value = '') {
  return value.toLowerCase().replace(/[^\w\u0900-\u097F\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function detectIntent(message = '') {
  const query = normalizeText(message);
  if (!query) return 'unknown';

  let bestIntent = 'unknown';
  let bestScore = 0;

  for (const [intent, phrases] of Object.entries(intentMap)) {
    if (!Array.isArray(phrases) || phrases.length === 0) {
      continue;
    }

    const normalizedPhrases = phrases.map((item) => normalizeText(item));
    const { bestMatch } = stringSimilarity.findBestMatch(query, normalizedPhrases);

    if (bestMatch.rating > bestScore) {
      bestScore = bestMatch.rating;
      bestIntent = intent;
    }
  }

  if (bestScore >= THRESHOLD) {
    return bestIntent;
  }

  return 'unknown';
}
