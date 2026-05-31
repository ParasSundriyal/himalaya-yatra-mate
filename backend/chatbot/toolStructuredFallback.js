/**
 * Deterministic structured fallback when LLM formatting fails but tools returned data.
 */
export function buildStructuredFromToolData(gatherMessages, message = '') {
  const toolPayloads = gatherMessages
    .filter((m) => m.role === 'tool' && m.content)
    .map((m) => {
      try {
        return JSON.parse(m.content);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (!toolPayloads.length) return null;

  for (const data of toolPayloads) {
    if (Array.isArray(data.results) && data.results.length) {
      const snippets = data.results.slice(0, 3);
      return {
        intent: 'temple_info',
        title: snippets[0].title || 'Web Search Results',
        summary: snippets[0].snippet?.slice(0, 280) || 'Information from web search.',
        icon: 'info',
        priority: 'normal',
        data: {
          sources: snippets.map((s) => ({
            title: s.title,
            url: s.url,
            snippet: (s.snippet || '').slice(0, 200),
          })),
          provider: data.provider || 'web',
        },
        actions: ['Temple Timings', 'Route Guidance', 'Weather Forecast', 'Nearby Places', 'Emergency Help'],
      };
    }

    const hotels = data.hotels || data.data?.hotels;
    if (Array.isArray(hotels) && hotels.length) {
      const mapped = hotels.slice(0, 6).map((h) => ({
        name: h.name || h.hotelName || 'Hotel',
        distance: h.location || h.distance || 'Near Dham',
        priceRange: h.pricePerNight != null ? `₹${h.pricePerNight} per night` : h.priceRange || 'Price on request',
      }));
      return {
        intent: 'hotel_search',
        title: 'Hotels near your Dham',
        summary: `${mapped.length} hotel${mapped.length > 1 ? 's' : ''} available from live listings.`,
        icon: 'hotel',
        priority: 'normal',
        data: { hotels: mapped },
        actions: ['Book a Hotel', 'Nearby Hotels', 'Route Guidance', 'Weather Forecast', 'Emergency Help'],
      };
    }

    if (Array.isArray(data.cards) && data.cards.length) {
      const badrinath = data.cards.find((c) => /badrinath/i.test(c.dham || ''));
      const card = badrinath || data.cards[0];
      const crowd = card?.crowd?.level || 'Medium';
      const temp = card?.temperatureC != null ? `${Math.round(card.temperatureC)}°C` : 'N/A';
      const wait = card?.waitTimeMins != null ? `${card.waitTimeMins} min` : 'N/A';
      return {
        intent: 'crowd_status',
        title: `${card.dham} Live Status`,
        summary: `Crowd ${crowd}, temperature ${temp}, estimated wait ${wait}.`,
        icon: 'crowd',
        priority: crowd === 'High' || crowd === 'Very High' ? 'important' : 'normal',
        data: {
          location: card.dham,
          level: crowd,
          estimatedWait: wait,
          status: `Temperature ${temp}`,
        },
        actions: ['Weather Forecast', 'Temple Timings', 'Route Guidance', 'Emergency Help'],
      };
    }

    if (data.dham && (data.crowd || data.level)) {
      return {
        intent: 'crowd_status',
        title: `${data.dham} Crowd Status`,
        summary: `Crowd level: ${data.crowd?.level || data.level || 'Medium'}.`,
        icon: 'crowd',
        priority: 'normal',
        data: {
          location: data.dham,
          level: data.crowd?.level || data.level,
          estimatedWait: data.waitTimeMins != null ? `${data.waitTimeMins} min` : '',
          status: data.status || 'Live',
        },
        actions: ['Weather Forecast', 'All Dhams Status', 'Route Guidance', 'Emergency Help'],
      };
    }

    if (Array.isArray(data.taxis) && data.taxis.length) {
      return {
        intent: 'general_chat',
        title: 'Taxi Availability',
        summary: `${data.taxis.length} taxis available for your yatra.`,
        icon: 'route',
        priority: 'normal',
        data: { taxis: data.taxis.slice(0, 5) },
        actions: ['Book Taxi', 'Route Guidance', 'Hotels Nearby', 'Emergency Help'],
      };
    }

    if (Array.isArray(data.areas) || Array.isArray(data.parkingAreas)) {
      const areas = data.areas || data.parkingAreas;
      return {
        intent: 'general_chat',
        title: 'Parking Availability',
        summary: `${areas.length} parking area${areas.length > 1 ? 's' : ''} found.`,
        icon: 'map',
        priority: 'normal',
        data: { parking: areas.slice(0, 5) },
        actions: ['Book Parking', 'Route Guidance', 'Hotels Nearby', 'Emergency Help'],
      };
    }
  }

  return {
    intent: 'general_chat',
    title: 'DhamSarthi AI',
    summary: 'Here is the latest information from our services for your query.',
    icon: 'info',
    priority: 'normal',
    data: { serviceData: toolPayloads[0] },
    actions: ['Weather Forecast', 'Temple Timings', 'Route Guidance', 'Emergency Help'],
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callWithRetry(fn, retries = 1, delayMs = 8000) {
  try {
    return await fn();
  } catch (error) {
    const isRateLimit = /rate limit|429/i.test(error.message || '');
    if (retries > 0 && isRateLimit) {
      await sleep(delayMs);
      return callWithRetry(fn, retries - 1, delayMs);
    }
    throw error;
  }
}
