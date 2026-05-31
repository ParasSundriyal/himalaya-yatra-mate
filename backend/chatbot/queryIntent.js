function normalizeText(value = '') {
  return value.toLowerCase().trim();
}

export function extractDham(message = '') {
  const lower = normalizeText(message);
  const dhams = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];
  return dhams.find((d) => lower.includes(d)) || null;
}

function capitalizeDham(dham) {
  if (!dham) return null;
  return dham.charAt(0).toUpperCase() + dham.slice(1);
}

/** Primary UI intent for a pilgrim query — drives prefetch + card layout. */
export function detectQueryIntent(message = '') {
  const lower = normalizeText(message);

  if (/emergency|sos|help me|accident|landslide|ambulance|112|108/.test(lower)) {
    return 'emergency';
  }
  // Before weather — "temple" must not match bare "temp"
  if (/history|historical|story|legend|significance|myth|about|who built|when was|origin|culture|tell me about|information on/.test(lower)) {
    return 'temple_info';
  }
  if (/weather|mausam|temperature|\btemp\b|rain|barish|thand|garmi|cloud|humidity|forecast/.test(lower)) {
    return 'weather';
  }
  if (/crowd|bheed|rush|wait time|wait|line|busy/.test(lower)) {
    return 'crowd_status';
  }
  if (/hotel|accommodation|stay|room|lodge|guest house|rest house/.test(lower)) {
    return 'hotel_search';
  }
  if (/darshan|timing|opening|closing|aarti|puja|darshan time/.test(lower)) {
    return 'darshan';
  }
  if (/route|how to reach|distance|travel|drive|trek|path/.test(lower)) {
    return 'route';
  }
  if (/pack|bring|carry|luggage|what to wear|essentials/.test(lower)) {
    return 'packing_checklist';
  }
  if (/nearby|attraction|places to visit|sightseeing/.test(lower)) {
    return 'nearby_places';
  }
  if (/hospital|medical|doctor|medicine|health/.test(lower)) {
    return 'medical_help';
  }
  if (/safe|safety|alert|warning|road close/.test(lower)) {
    return 'safety_alert';
  }
  if (/plan|itinerary|schedule|days|trip/.test(lower)) {
    return 'travel_plan';
  }

  return 'general_chat';
}

export function dhamDisplayName(message = '', fallbackDham = null) {
  const dham = extractDham(message) || fallbackDham;
  return dham ? capitalizeDham(dham) : 'Char Dham';
}

export { capitalizeDham };
