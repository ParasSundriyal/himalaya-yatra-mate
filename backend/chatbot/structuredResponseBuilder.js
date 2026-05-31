import { detectQueryIntent, extractDham, capitalizeDham } from './queryIntent.js';
import { buildDhamActions, dedupeActions } from './dhamContext.js';

const INTENT_ACTIONS = {
  weather: ['Crowd Status', 'Route Guidance', 'Darshan Timings', 'Emergency Help'],
  temple_info: ['Darshan Timings', 'Route Guidance', 'Weather Forecast', 'Nearby Places'],
  hotel_search: ['Book a Hotel', 'Route Guidance', 'Weather Forecast', 'Emergency Help'],
  crowd_status: ['Weather Forecast', 'Temple Timings', 'Route Guidance', 'Emergency Help'],
  darshan: ['Crowd Status', 'Route Guidance', 'Hotels Nearby', 'Weather Forecast'],
  route: ['Weather Forecast', 'Hotels Nearby', 'Darshan Timings', 'Emergency Help'],
  travel_plan: ['Route Guidance', 'Hotels Nearby', 'Darshan Timings', 'Weather Forecast'],
  packing_checklist: ['Weather Forecast', 'Route Guidance', 'Medical Help', 'Emergency Help'],
  nearby_places: ['Route Guidance', 'Hotels Nearby', 'Weather Forecast', 'Darshan Timings'],
  emergency: ['Call 112', 'Medical Help', 'Route Guidance', 'Safety Alerts'],
  general_chat: ['Weather Forecast', 'Temple Timings', 'Route Guidance', 'Emergency Help'],
};

function findPrefetched(prefetched, tool) {
  return prefetched.find((p) => p.tool === tool)?.data;
}

function actionsFor(intent, dham) {
  return buildDhamActions(dham, INTENT_ACTIONS[intent] || INTENT_ACTIONS.general_chat);
}

function pickDashboardCard(cards, dham) {
  if (!cards?.length) return null;
  if (!dham) return cards[0];
  const key = dham.toLowerCase();
  return (
    cards.find((c) => String(c.dham || '').toLowerCase().includes(key)) ||
    cards.find((c) => c.dham?.toLowerCase()?.startsWith(key.slice(0, 4))) ||
    null
  );
}

/**
 * Build intent-correct structured card from prefetched service data only.
 */
export function buildStructuredFromPrefetch(message, prefetched, forcedIntent, resolvedDham = null) {
  const intent = forcedIntent || detectQueryIntent(message);
  const dham = resolvedDham || extractDham(message);
  const place = dham ? capitalizeDham(dham) : 'Char Dham';

  if (intent === 'emergency') {
    return {
      intent: 'emergency',
      title: 'Emergency Assistance',
      summary: 'Stay calm. Use the helplines below and reach the nearest medical or police post.',
      icon: 'emergency',
      priority: 'critical',
      data: { police: '112', ambulance: '108', disasterManagement: '1070' },
      actions: actionsFor('emergency', dham),
    };
  }

  if (intent === 'weather') {
    const w = findPrefetched(prefetched, 'get_weather');
    if (w && !w.error) {
      const loc = w.location || place;
      return {
        intent: 'weather',
        title: `${loc} Weather`,
        summary: `${w.condition} — ${w.temperature} at ${loc} right now.`,
        icon: 'weather',
        priority: /rain|snow|storm|heavy/i.test(w.condition || '') ? 'important' : 'normal',
        data: {
          location: loc,
          temperature: w.temperature,
          condition: w.condition,
          wind: w.wind,
          humidity: w.humidity,
          rainChance: w.rainChance,
          clouds: w.clouds,
        },
        actions: actionsFor('weather', dham || loc.toLowerCase()),
      };
    }
  }

  if (intent === 'temple_info') {
    const search = findPrefetched(prefetched, 'web_search');
    if (search?.results?.length) {
      const top = search.results[0];
      const snippet = top.snippet || '';
      const templeName = top.title?.replace(/ Wikipedia.*/i, '') || place;
      return {
        intent: 'temple_info',
        title: `${templeName} — History & Significance`,
        summary: snippet.slice(0, 280),
        icon: 'temple',
        priority: 'normal',
        data: {
          name: templeName,
          dham: dham || extractDham(message),
          location: place,
          history: snippet.slice(0, 400),
          importance:
            search.results[1]?.snippet?.slice(0, 200) ||
            'One of the sacred Char Dham pilgrimage sites in Uttarakhand.',
        },
        actions: actionsFor('temple_info', dham),
      };
    }
  }

  if (intent === 'hotel_search') {
    const hotels = findPrefetched(prefetched, 'get_hotels');
    const list = hotels?.hotels || [];
    if (list.length) {
      const mapped = list.slice(0, 5).map((h) => ({
        name: h.name,
        distance: h.location || `Near ${place}`,
        priceRange: h.pricePerNight != null ? `₹${h.pricePerNight}/night` : 'On request',
      }));
      return {
        intent: 'hotel_search',
        title: `Hotels near ${place}`,
        summary: `${mapped.length} hotel${mapped.length > 1 ? 's' : ''} available near ${place}.`,
        icon: 'hotel',
        priority: 'normal',
        data: { hotels: mapped },
        actions: actionsFor('hotel_search', dham),
      };
    }
  }

  if (intent === 'crowd_status') {
    const crowd = findPrefetched(prefetched, 'get_crowd_live');
    const dash = findPrefetched(prefetched, 'get_dashboard_live');

    if (crowd && !crowd.error) {
      const level = crowd.crowd?.level || crowd.level || 'Medium';
      const wait = crowd.waitTimeMins != null ? `${crowd.waitTimeMins} min` : 'N/A';
      const loc = crowd.dham ? capitalizeDham(crowd.dham) : place;
      return {
        intent: 'crowd_status',
        title: `${loc} Crowd Status`,
        summary: `Current crowd: ${level}. Estimated wait: ${wait}.`,
        icon: 'crowd',
        priority: /high|very/i.test(level) ? 'important' : 'normal',
        data: {
          location: loc,
          level,
          estimatedWait: wait,
          status: 'Live',
        },
        actions: actionsFor('crowd_status', dham || crowd.dham),
      };
    }

    const card = pickDashboardCard(dash?.cards, dham);
    if (card) {
      const level = card.crowd?.level || 'Medium';
      const wait = card.waitTimeMins != null ? `${card.waitTimeMins} min` : 'N/A';
      const cardDham = card.dham || place;
      return {
        intent: 'crowd_status',
        title: `${cardDham} Crowd Status`,
        summary: `Crowd ${level}. Estimated wait ${wait}.`,
        icon: 'crowd',
        priority: /high|very/i.test(level) ? 'important' : 'normal',
        data: {
          location: cardDham,
          level,
          estimatedWait: wait,
          status: 'Live',
        },
        actions: actionsFor('crowd_status', dham || String(cardDham).toLowerCase()),
      };
    }
  }

  if (intent === 'darshan') {
    const status = findPrefetched(prefetched, 'get_dham_status');
    if (!dham) {
      return {
        intent: 'darshan',
        title: 'Darshan Timings',
        summary: 'Please mention a Dham — Yamunotri, Gangotri, Kedarnath, or Badrinath — for opening dates.',
        icon: 'temple',
        priority: 'normal',
        data: {},
        actions: buildDhamActions(null, [
          'Yamunotri darshan timings',
          'Gangotri darshan timings',
          'Kedarnath darshan timings',
          'Badrinath darshan timings',
        ]),
      };
    }

    const info = status?.[dham];
    if (info) {
      return {
        intent: 'darshan',
        title: `${place} Darshan`,
        summary: info.isOpen
          ? `${place} is open for darshan until ${info.closingDate}.`
          : `${place} opens on ${info.openingDate} (${info.daysUntilOpen} days).`,
        icon: 'temple',
        priority: 'normal',
        data: {
          temple: place,
          openingTime: info.openingDate,
          closingTime: info.closingDate,
          estimatedWait: 'Check crowd status',
          status: info.isOpen ? 'Open' : 'Closed',
        },
        actions: actionsFor('darshan', dham),
      };
    }
  }

  if (intent === 'nearby_places') {
    const nearby = findPrefetched(prefetched, 'get_nearby_attractions');
    if (nearby?.nearbyAttractions?.length) {
      const places = nearby.nearbyAttractions.slice(0, 5).map((name) => ({
        name: typeof name === 'string' ? name : name.name || 'Place',
        distance: 'Near Dham',
        description: typeof name === 'object' ? name.description || '' : '',
      }));
      return {
        intent: 'nearby_places',
        title: `Places near ${nearby.displayName || place}`,
        summary: `${places.length} nearby places to visit during your yatra.`,
        icon: 'map',
        priority: 'normal',
        data: { places },
        actions: actionsFor('nearby_places', dham || nearby.dham),
      };
    }
  }

  if (intent === 'route' || intent === 'travel_plan') {
    const search = findPrefetched(prefetched, 'web_search');
    if (search?.results?.length) {
      const top = search.results[0];
      const snippet = (top.snippet || '').slice(0, 320);
      const routePlace = dham ? capitalizeDham(dham) : extractDham(message) ? capitalizeDham(extractDham(message)) : place;
      const stops = search.results.slice(0, 4).map((r) => r.title?.replace(/ Wikipedia.*/i, '') || 'Stop');
      return {
        intent: intent === 'travel_plan' ? 'travel_plan' : 'route',
        title: intent === 'travel_plan' ? `${routePlace} Travel Plan` : `Route to ${routePlace}`,
        summary: snippet || `How to reach ${routePlace} on the Char Dham Yatra.`,
        icon: 'route',
        priority: 'normal',
        data: {
          dham: routePlace.toLowerCase(),
          location: routePlace,
          travelTime: 'Varies by starting point',
          distance: 'See route details',
          stops,
          tips: search.results.slice(1, 3).map((r) => (r.snippet || '').slice(0, 120)).filter(Boolean),
        },
        actions: actionsFor(intent === 'travel_plan' ? 'travel_plan' : 'route', dham || extractDham(message)),
      };
    }
  }

  if (intent === 'packing_checklist') {
    const search = findPrefetched(prefetched, 'web_search');
    if (search?.results?.length) {
      const items = search.results
        .flatMap((r) => (r.snippet || '').split(/[,;•\n]/).map((s) => s.trim()).filter((s) => s.length > 3 && s.length < 60))
        .slice(0, 8);
      return {
        intent: 'packing_checklist',
        title: `Packing for ${place}`,
        summary: search.results[0].snippet?.slice(0, 240) || `Essentials for your ${place} yatra.`,
        icon: 'bag',
        priority: 'normal',
        data: {
          items: items.length
            ? items
            : ['Warm layers', 'Rain gear', 'Comfortable trekking shoes', 'ID & yatra registration', 'First-aid kit', 'Snacks & water'],
        },
        actions: actionsFor('packing_checklist', dham),
      };
    }
  }

  return null;
}

export function buildGeneralChatFallback(message, resolvedDham = null) {
  const dham = resolvedDham || extractDham(message);
  const place = dham ? capitalizeDham(dham) : null;
  return {
    intent: 'general_chat',
    title: 'DhamSarthi AI',
    summary: place
      ? `How can I help with your ${place} yatra? Ask about weather, darshan timings, hotels, crowd, or routes.`
      : 'Welcome to Char Dham Yatra! Mention a Dham — Yamunotri, Gangotri, Kedarnath, or Badrinath — and ask about weather, timings, hotels, or routes.',
    icon: 'info',
    priority: 'normal',
    data: place ? { dham: place } : {},
    actions: buildDhamActions(
      dham,
      ['Weather Forecast', 'Darshan Timings', 'Hotels Nearby', 'Route Guidance', 'Emergency Help'],
    ),
  };
}

export function alignResponseToIntent(parsed, message, prefetched, resolvedDham = null) {
  const expected = detectQueryIntent(message);
  const built = buildStructuredFromPrefetch(message, prefetched, expected, resolvedDham);

  if (built && expected !== 'general_chat') {
    if (parsed.intent !== expected || !hasIntentFields(parsed, expected)) {
      return {
        ...built,
        summary: parsed.summary && parsed.intent === expected ? parsed.summary : built.summary,
        actions: dedupeActions(
          built.actions?.length >= 3 ? built.actions : buildDhamActions(resolvedDham, built.actions),
        ),
      };
    }
    if (resolvedDham) {
      return {
        ...parsed,
        actions: buildDhamActions(resolvedDham, parsed.actions),
        data: fixDataDham(parsed.data, expected, resolvedDham),
      };
    }
  }

  return parsed;
}

function fixDataDham(data, intent, dham) {
  if (!dham || !data) return data;
  const place = capitalizeDham(dham);
  const next = { ...data };
  if (intent === 'darshan' && next.temple && !String(next.temple).toLowerCase().includes(dham)) {
    next.temple = place;
  }
  if (intent === 'weather' && next.location && !String(next.location).toLowerCase().includes(dham)) {
    next.location = place;
  }
  if (intent === 'crowd_status' && next.location && !String(next.location).toLowerCase().includes(dham)) {
    next.location = place;
  }
  return next;
}

function hasIntentFields(parsed, intent) {
  const d = parsed.data || {};
  switch (intent) {
    case 'weather':
      return Boolean(d.temperature || d.condition);
    case 'temple_info':
      return Boolean(d.history || d.importance);
    case 'hotel_search':
      return Array.isArray(d.hotels) && d.hotels.length > 0;
    case 'crowd_status':
      return Boolean(d.level || d.estimatedWait);
    case 'darshan':
      return Boolean(d.temple || d.openingTime);
    default:
      return Object.keys(d).length > 0;
  }
}

export function formatIntentHint(intent, message, resolvedDham = null) {
  const dham = resolvedDham || extractDham(message);
  const place = dham ? capitalizeDham(dham) : 'the Dham mentioned by the pilgrim';
  const hints = {
    weather: `Use intent "weather". data must include: location, temperature, condition, wind, humidity, rainChance, clouds. Location MUST be ${place} — not any other Dham.`,
    temple_info: `Use intent "temple_info". data must include: name, location, history, importance. Topic: ${message}. Location: ${place}.`,
    hotel_search: `Use intent "hotel_search". data.hotels must list hotels near ${place} only.`,
    crowd_status: `Use intent "crowd_status". data must include: location (${place}), level, estimatedWait, status.`,
    darshan: `Use intent "darshan". data.temple MUST be ${place}. Include openingTime, closingTime, estimatedWait, status from service data.`,
    nearby_places: `Use intent "nearby_places". data.places array for ${place} only.`,
    packing_checklist: `Use intent "packing_checklist". data.items array for ${place} yatra.`,
    route: `Use intent "route". data must include: travelTime, distance, stops[] for ${place}.`,
    emergency: `Use intent "emergency". priority critical.`,
  };
  return hints[intent] || `Use intent "${intent}" with matching data fields for ${place} only.`;
}
