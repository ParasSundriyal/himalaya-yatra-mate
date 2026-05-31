import { extractDham, capitalizeDham } from './queryIntent.js';

const DHAMS = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];
const store = new Map();

function userKey(userId) {
  return userId && typeof userId === 'string' ? userId : 'anonymous';
}

export function setLastDham(userId, dham) {
  if (!dham || !DHAMS.includes(String(dham).toLowerCase())) return;
  const key = userKey(userId);
  store.set(key, { dham: String(dham).toLowerCase(), at: Date.now() });
}

export function getLastDham(userId) {
  return store.get(userKey(userId))?.dham || null;
}

/** Dham from current message, else last mentioned in session — never hardcode Kedarnath. */
export function resolveDham(message = '', userId) {
  return extractDham(message) || getLastDham(userId) || null;
}

export function resolveDhamDisplay(message = '', userId) {
  const dham = resolveDham(message, userId);
  return dham ? capitalizeDham(dham) : null;
}

export function rememberDhamFromMessage(message, userId) {
  const dham = extractDham(message);
  if (dham) setLastDham(userId, dham);
  return dham;
}

/** Turn generic action labels into dham-specific follow-up queries. */
export function contextualActionQuery(action, dham) {
  const fromAction = extractDham(String(action));
  if (fromAction) return action;

  if (!dham) return action;
  const place = capitalizeDham(dham);
  const lower = String(action).toLowerCase();

  if (/darshan|temple timing|timings|opening|aarti/.test(lower)) {
    return `${place} darshan timings`;
  }
  if (/weather|mausam|forecast/.test(lower)) {
    return `${place} weather today`;
  }
  if (/crowd|wait|rush|bheed/.test(lower)) {
    return `${place} crowd status`;
  }
  if (/emergency|112|108|sos/.test(lower)) {
    return `emergency help on ${place} Char Dham route`;
  }
  if (/route guidance|how to reach|travel plan|^route to\b|\broute how to reach\b/i.test(lower)) {
    return `${place} route how to reach`;
  }
  if (/hotel|stay|accommodation|book a hotel/.test(lower)) {
    return `hotels near ${place}`;
  }
  if (/nearby|places/.test(lower)) {
    return `places to visit near ${place}`;
  }
  if (/history|about|significance|temple info/.test(lower)) {
    return `history of ${place} temple`;
  }
  if (/pack|essentials/.test(lower)) {
    return `what to pack for ${place} yatra`;
  }

  return `${place} — ${action}`;
}

/** Keep action chip labels unique for React keys and UI. */
export function dedupeActions(actions = []) {
  const seen = new Set();
  const out = [];
  for (const action of actions) {
    const key = String(action).trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function buildDhamActions(dham, labels = []) {
  const mapped = !dham ? labels : labels.map((label) => contextualActionQuery(label, dham));
  return dedupeActions(mapped);
}
