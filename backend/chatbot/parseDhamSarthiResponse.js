const ALLOWED_INTENTS = new Set([
  'weather',
  'route',
  'darshan',
  'temple_info',
  'crowd_status',
  'hotel_search',
  'medical_help',
  'emergency',
  'packing_checklist',
  'travel_plan',
  'nearby_places',
  'safety_alert',
  'general_chat',
]);

const ALLOWED_ICONS = new Set([
  'weather',
  'route',
  'temple',
  'hotel',
  'hospital',
  'emergency',
  'bag',
  'map',
  'crowd',
  'info',
  'alert',
]);

const ALLOWED_PRIORITIES = new Set(['normal', 'important', 'critical']);

const INTENT_ICON_DEFAULTS = {
  weather: 'weather',
  route: 'route',
  darshan: 'temple',
  temple_info: 'temple',
  crowd_status: 'crowd',
  hotel_search: 'hotel',
  medical_help: 'hospital',
  emergency: 'emergency',
  packing_checklist: 'bag',
  travel_plan: 'map',
  nearby_places: 'map',
  safety_alert: 'alert',
  general_chat: 'info',
};

const DEFAULT_ACTIONS = [
  'Weather Forecast',
  'Temple Timings',
  'Route Guidance',
  'Emergency Help',
];

function extractJsonString(raw = '') {
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return null;
}

function normalizeActions(actions) {
  if (!Array.isArray(actions)) return DEFAULT_ACTIONS.slice(0, 4);
  const seen = new Set();
  const cleaned = [];
  for (const a of actions) {
    if (typeof a !== 'string') continue;
    const key = a.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(key);
    if (cleaned.length >= 5) break;
  }
  while (cleaned.length < 3) {
    const fallback = DEFAULT_ACTIONS.find((a) => !seen.has(a));
    if (!fallback) break;
    seen.add(fallback);
    cleaned.push(fallback);
  }
  return cleaned.slice(0, 5);
}

function normalizePriority(priority, intent) {
  if (ALLOWED_PRIORITIES.has(priority)) return priority;
  if (intent === 'emergency') return 'critical';
  if (intent === 'medical_help' || intent === 'safety_alert') return 'important';
  return 'normal';
}

/**
 * Returns parsed response only when raw text contains valid DhamSarthi JSON.
 */
export function tryParseDhamSarthiJson(raw) {
  const jsonStr = extractJsonString(raw);
  if (!jsonStr) return null;

  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.intent !== 'string' || typeof parsed.summary !== 'string') return null;
    return parseDhamSarthiResponse(raw, '');
  } catch {
    return null;
  }
}

/**
 * Parse and validate a DhamSarthi JSON response from raw LLM output.
 */
export function parseDhamSarthiResponse(raw, fallbackSummary = '') {
  const jsonStr = extractJsonString(raw);
  let parsed = null;

  if (jsonStr) {
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = null;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      intent: 'general_chat',
      title: 'DhamSarthi AI',
      summary: fallbackSummary || 'Jai Bholenath! How may I guide your yatra today?',
      icon: 'info',
      priority: 'normal',
      data: {},
      actions: DEFAULT_ACTIONS.slice(0, 4),
    };
  }

  const intent = ALLOWED_INTENTS.has(parsed.intent) ? parsed.intent : 'general_chat';
  const icon = ALLOWED_ICONS.has(parsed.icon) ? parsed.icon : INTENT_ICON_DEFAULTS[intent];
  const title =
    typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim()
      : 'DhamSarthi AI';
  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : fallbackSummary || title;

  return {
    intent,
    title,
    summary,
    icon,
    priority: normalizePriority(parsed.priority, intent),
    data: parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data) ? parsed.data : {},
    actions: normalizeActions(parsed.actions),
  };
}
