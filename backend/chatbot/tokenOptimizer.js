/**
 * Compress service payloads before sending to the LLM (saves input tokens).
 */
export function compressToolPayload(tool, data) {
  if (!data || data.error) return data;

  switch (tool) {
    case 'get_hotels':
      return {
        count: data.count,
        hotels: (data.hotels || []).slice(0, 5).map((h) => ({
          id: h._id || h.id,
          name: h.name,
          location: h.location,
          pricePerNight: h.pricePerNight,
          rating: h.rating,
          availableRooms: h.availableRooms,
        })),
      };

    case 'get_taxis':
      return {
        count: data.count,
        taxis: (data.taxis || []).slice(0, 5).map((t) => ({
          id: t._id || t.id,
          driverName: t.driverName,
          vehicleType: t.vehicleType,
          seats: t.seats,
          ratePerKm: t.ratePerKm,
          location: t.location,
        })),
      };

    case 'get_parking_areas':
      return {
        count: data.count,
        areas: (data.areas || data.parkingAreas || []).slice(0, 5).map((a) => ({
          id: a._id || a.id,
          name: a.name,
          location: a.location,
          availableSlots: a.availableSlots,
          totalSlots: a.totalSlots,
        })),
      };

    case 'get_dashboard_live':
      return {
        cards: (data.cards || []).map((c) => ({
          dham: c.dham,
          crowd: c.crowd?.level,
          tempC: c.temperatureC != null ? Math.round(c.temperatureC) : null,
          waitMin: c.waitTimeMins,
        })),
      };

    case 'get_weather':
      return {
        location: data.location,
        temperature: data.temperature,
        condition: data.condition,
        wind: data.wind,
        humidity: data.humidity,
        rainChance: data.rainChance,
        clouds: data.clouds,
        source: data.source,
      };

    case 'get_crowd_live':
      return {
        dham: data.dham,
        level: data.crowd?.level || data.level,
        waitMin: data.waitTimeMins,
        temperatureC: data.temperatureC,
      };

    case 'get_dham_status':
      if (Array.isArray(data.dhams)) {
        return {
          dhams: data.dhams.slice(0, 4).map((d) => ({
            name: d.name || d.dham,
            status: d.status,
            openingDate: d.openingDate,
            closingDate: d.closingDate,
          })),
        };
      }
      return truncateObject(data, 800);

    case 'web_search':
      return {
        provider: data.provider,
        results: (data.results || []).slice(0, 3).map((r) => ({
          title: r.title,
          snippet: (r.snippet || '').slice(0, 280),
        })),
      };

    case 'get_nearby_attractions':
      return {
        dham: data.dham,
        displayName: data.displayName,
        nearbyAttractions: (data.nearbyAttractions || []).slice(0, 6),
      };

    case 'get_my_hotel_bookings':
    case 'get_my_parking_bookings':
    case 'get_my_taxi_bookings':
    case 'get_my_hourly_passes':
      return {
        count: data.count,
        bookings: (data.bookings || []).slice(0, 3).map((b) => ({
          id: b._id || b.id,
          status: b.status,
          amount: b.amount,
          bookingType: b.bookingType,
        })),
      };

    default:
      return truncateObject(data, 900);
  }
}

function truncateObject(obj, maxChars) {
  const str = JSON.stringify(obj);
  if (str.length <= maxChars) return obj;
  return { truncated: true, preview: str.slice(0, maxChars) };
}

/**
 * Pick a small subset of tools for the LLM tool-calling phase (definitions are token-heavy).
 */
export function selectToolDefinitions(message, allDefinitions) {
  const lower = message.toLowerCase();
  const names = new Set(['web_search', 'get_dashboard_live', 'get_dham_status']);

  if (/hotel|stay|room|accommodation|lodge|होटल/.test(lower)) {
    names.add('get_hotels');
    names.add('get_my_hotel_bookings');
    names.add('book_hotel');
  }
  if (/taxi|cab|transport|टैक्सी/.test(lower)) {
    names.add('get_taxis');
    names.add('get_my_taxi_bookings');
    names.add('book_taxi');
  }
  if (/parking|park|slot|पार्किंग/.test(lower)) {
    names.add('get_parking_areas');
    names.add('get_parking_slots');
    names.add('get_my_parking_bookings');
    names.add('book_parking');
  }
  if (/pass|checkpoint|hourly/.test(lower)) {
    names.add('get_checkpoints');
    names.add('get_hourly_pass_slots');
    names.add('get_my_hourly_passes');
    names.add('book_hourly_pass');
  }
  if (/weather|mausam|temperature|crowd|bheed/.test(lower)) {
    names.add('get_weather');
    names.add('get_crowd_live');
  }
  if (/nearby|attraction|places|visit/.test(lower)) {
    names.add('get_nearby_attractions');
  }
  if (/my booking|my pass|meri booking/.test(lower)) {
    names.add('get_my_hotel_bookings');
    names.add('get_my_parking_bookings');
    names.add('get_my_taxi_bookings');
    names.add('get_my_hourly_passes');
  }
  if (/book|reserve|confirm/.test(lower)) {
    names.add('book_hotel');
    names.add('book_parking');
    names.add('book_taxi');
    names.add('book_hourly_pass');
  }

  const selected = allDefinitions.filter((t) => names.has(t.function.name));
  return selected.length ? selected : allDefinitions.slice(0, 6);
}

/** Skip the tool-calling LLM phase when prefetch already fetched what we need. */
export function shouldSkipToolGathering(message, prefetched) {
  const lower = message.toLowerCase();
  if (/book|reserve|confirm|proceed|shall i|cancel/.test(lower)) return false;
  if (!prefetched.length) return false;
  return true;
}

/** Only booking / account flows need Groq — everything else uses live prefetch cards. */
export function requiresLlmForMessage(message) {
  const lower = message.toLowerCase();
  return /book|reserve|confirm|proceed|shall i|cancel my|meri booking|my booking|my pass/.test(lower);
}

export function compressPrefetched(prefetched = []) {
  return prefetched.map(({ tool, data }) => ({
    tool,
    data: compressToolPayload(tool, data),
  }));
}

export function formatCompactContext(prefetched = [], extraToolMessages = []) {
  const parts = prefetched.map(
    ({ tool, data }) => `[${tool}] ${JSON.stringify(compressToolPayload(tool, data))}`,
  );

  for (const msg of extraToolMessages) {
    if (msg.role !== 'tool' || !msg.content) continue;
    try {
      const parsed = JSON.parse(msg.content);
      const tool = parsed.tool || 'service';
      parts.push(`[${tool}] ${JSON.stringify(compressToolPayload(tool, parsed))}`);
    } catch {
      parts.push(msg.content.slice(0, 600));
    }
  }

  return parts.join('\n');
}
