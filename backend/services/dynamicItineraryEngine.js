import { DHAM_KEYS, DHAM_INFO, displayNameForDham } from '../constants/dhamData.js';
import { fetchWeatherMapForDhams, weatherForDay, DHAM_COORDS } from './weatherService.js';
import { fetchCrowdMapForTrip } from './crowdService.js';
import { loadDhamPois, geocodeDham } from './opentripmapService.js';
import {
  calculateTripBudget,
  dailyBudgetEstimate,
} from './itineraryBudgetEngine.js';

const ROUTE_ORDER = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];

const DHAM_KM_BETWEEN = {
  'yamunotri-gangotri': 220,
  'gangotri-kedarnath': 260,
  'kedarnath-badrinath': 230,
};

function addDaysUtc(startStr, n) {
  const d = new Date(`${startStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function orderedDhams(selected) {
  const set = new Set(selected.map((d) => String(d).toLowerCase()));
  return ROUTE_ORDER.filter((k) => set.has(k));
}

/** Minimum shrine-leg days per dham (not counting plains arrival/return). */
function minDaysForDham(dhamKey, travelMode) {
  switch (dhamKey) {
    case 'kedarnath':
      if (travelMode === 'helicopter') return 2;
      if (travelMode === 'trek' || travelMode === 'mixed') return 3;
      return 2;
    case 'yamunotri':
      return travelMode === 'trek' ? 2 : 2;
    case 'gangotri':
      return 1;
    case 'badrinath':
      return 1;
    default:
      return 1;
  }
}

/** Distinct day-by-day phases — avoids repeating "temple darshan" on trek days. */
function getDhamPhaseTemplates(dhamKey, travelMode) {
  if (dhamKey === 'kedarnath') {
    if (travelMode === 'helicopter') {
      return [
        {
          phase: 'approach',
          title: 'Reach helipad base (Phata / Guptkashi)',
          location: 'Guptkashi / Phata',
        },
        {
          phase: 'darshan',
          title: 'Helicopter to Kedarnath & darshan',
          location: 'Kedarnath',
        },
      ];
    }
    if (travelMode === 'trek' || travelMode === 'mixed') {
      return [
        {
          phase: 'approach',
          title: 'Reach Sonprayag / Gaurikund (trek base)',
          location: 'Gaurikund (trek base)',
        },
        {
          phase: 'ascent',
          title: 'Trek up to Kedarnath',
          location: 'Kedarnath',
        },
        {
          phase: 'descent',
          title: 'Morning darshan & trek down to base',
          location: 'Gaurikund',
        },
      ];
    }
    return [
      {
        phase: 'approach',
        title: 'Drive to Sonprayag / Gaurikund',
        location: 'Gaurikund',
      },
      {
        phase: 'darshan',
        title: 'Kedarnath darshan day',
        location: 'Kedarnath',
      },
    ];
  }

  if (dhamKey === 'yamunotri') {
    return [
      {
        phase: 'approach',
        title: 'Reach Janki Chatti (trek base)',
        location: 'Janki Chatti',
      },
      {
        phase: 'darshan',
        title: 'Trek to Yamunotri & darshan',
        location: 'Yamunotri',
      },
    ];
  }

  return [
    {
      phase: 'darshan',
      title: `${displayNameForDham(dhamKey)} darshan`,
      location: DHAM_INFO[dhamKey]?.baseLocation || displayNameForDham(dhamKey),
    },
  ];
}

function computeMinTripDays(selectedDhams, travelMode) {
  const n = selectedDhams.length;
  const dhamDays = selectedDhams.reduce(
    (s, d) => s + minDaysForDham(d, travelMode),
    0,
  );
  const travelPadding = n === 1 ? 0 : 1;
  const returnPadding = n === 1 ? 0 : 1;
  return dhamDays + travelPadding + returnPadding;
}

/**
 * Build exactly `totalDays` schedule entries — no padding extra shrine repeats.
 */
function buildTripSchedule(selectedDhams, totalDays, travelMode) {
  const n = selectedDhams.length;
  const singleDham = n === 1;
  const minCore = selectedDhams.reduce(
    (s, d) => s + minDaysForDham(d, travelMode),
    0,
  );

  const segments = [];

  const addArrival =
    !singleDham || (totalDays >= minCore + 2 && travelMode === 'road');
  const addReturn = !singleDham && totalDays >= minCore + 2;

  if (addArrival) {
    segments.push({
      kind: 'arrival',
      title: 'Arrival & acclimatisation',
      location: 'Haridwar / Rishikesh',
    });
  }

  for (let i = 0; i < selectedDhams.length; i++) {
    const dham = selectedDhams[i];
    const phases = getDhamPhaseTemplates(dham, travelMode);
    const allowed = Math.min(
      phases.length,
      minDaysForDham(dham, travelMode),
    );
    for (let p = 0; p < allowed; p++) {
      segments.push({ kind: 'dham', dham, ...phases[p] });
    }
  }

  if (addReturn) {
    segments.push({
      kind: 'return',
      title: 'Return journey to plains',
      location: 'Haridwar / Dehradun',
    });
  }

  while (segments.length > totalDays) {
    const last = segments[segments.length - 1];
    if (last?.kind === 'return') {
      segments.pop();
      continue;
    }
    if (segments[0]?.kind === 'arrival' && singleDham) {
      segments.shift();
      continue;
    }
    const dupIdx = segments.findIndex(
      (s, i) =>
        i > 0 &&
        s.kind === 'dham' &&
        segments[i - 1].kind === 'dham' &&
        s.dham === segments[i - 1].dham &&
        s.phase === segments[i - 1].phase,
    );
    if (dupIdx >= 0) {
      segments.splice(dupIdx, 1);
      continue;
    }
  }

  while (segments.length < totalDays) {
    const insertAt = addReturn ? segments.length - 1 : segments.length;
    segments.splice(insertAt, 0, {
      kind: 'buffer',
      title: 'Rest / travel buffer',
      location: 'En route',
      description:
        'Flexible day for weather, road conditions, or acclimatisation — not a repeat darshan.',
    });
  }

  return segments.slice(0, totalDays);
}

function rainChancePct(weather) {
  if (!weather) return 0;
  if (weather.rainChance != null) return weather.rainChance;
  const rain = weather.rainMm ?? 0;
  if (rain > 40) return 90;
  if (rain > 20) return 70;
  if (rain > 8) return 45;
  if (String(weather.condition).toLowerCase().includes('rain')) return 55;
  return Math.min(30, Math.round(rain * 2));
}

function attachWeather(weatherMap, locationName, dateStr, altitude = 'high') {
  const w = weatherForDay(weatherMap, locationName, dateStr, altitude);
  return {
    weather: {
      avgTempC: w.avgTempC,
      condition: w.condition,
      rainMm: w.rainMm,
    },
    rainChance: rainChancePct(w),
    weatherSource: w._source,
  };
}

function isBadWeather(weather) {
  if (!weather) return false;
  const c = String(weather.condition || '').toLowerCase();
  if (c.includes('snow') || c.includes('thunder')) return true;
  if ((weather.rainMm ?? 0) > 25) return true;
  if ((weather.avgTempC ?? 20) < 2) return true;
  return false;
}

function crowdBadge(level) {
  const u = String(level || 'medium').toLowerCase();
  if (u === 'low') return { emoji: '🟢', label: 'Low', level: 'Low' };
  if (u === 'high') return { emoji: '🔴', label: 'High', level: 'High' };
  return { emoji: '🟡', label: 'Moderate', level: 'Medium' };
}

function buildSlotsForPhase(segment, pois, poiOffset) {
  const slots = { morning: [], afternoon: [], evening: [] };
  const list = [...(pois || [])];
  const pick = (i) =>
    list.length ? { ...list[(poiOffset + i) % list.length] } : null;

  const { phase, kind } = segment;

  if (kind === 'arrival') {
    slots.morning.push({
      name: 'Reach Haridwar / Rishikesh',
      time: '10:00–12:00',
      description: 'Check in, permits, and rest.',
      category: 'travel',
    });
    slots.afternoon.push({
      name: 'Ganga aarti (optional)',
      time: '17:00–19:00',
      description: 'Evening prayers at Har Ki Pauri.',
      category: 'religion',
    });
    return slots;
  }

  if (kind === 'return') {
    slots.morning.push({
      name: 'Depart for Haridwar / Dehradun',
      time: '08:00–12:00',
      description: 'Begin return leg; buffer for monsoon road delays.',
      category: 'travel',
    });
    return slots;
  }

  if (kind === 'buffer') {
    slots.morning.push({
      name: 'Rest or short local walk',
      time: '09:00–12:00',
      description: segment.description || 'Buffer day — adjust per road/weather.',
      category: 'other',
    });
    return slots;
  }

  if (phase === 'approach') {
    slots.morning.push({
      name: 'Continue by road to base camp',
      time: '08:00–13:00',
      description: 'Scenic drive; mandatory stopovers where required.',
      category: 'travel',
    });
    const p = pick(0);
    if (p) {
      slots.evening.push({
        ...p,
        time: '16:00–18:00',
        description: p.description || 'Light exploration near base.',
      });
    }
    return slots;
  }

  if (phase === 'ascent') {
    slots.morning.push({
      name: 'Start trek uphill',
      time: '05:00–08:00',
      description: 'Begin early; carry water, rain layer, and permit.',
      category: 'trek',
    });
    slots.afternoon.push({
      name: 'Arrive at shrine — rest & acclimatise',
      time: '12:00–15:00',
      description: 'Check into lodge; darshan queue may be lighter at opening next morning.',
      category: 'trek',
    });
    const p = pick(1);
    if (p) slots.evening.push({ ...p, time: '16:00–18:00' });
    return slots;
  }

  if (phase === 'descent') {
    slots.morning.push({
      name: 'Temple darshan',
      time: '05:00–08:00',
      description: 'Main shrine visit — follow local timings.',
      category: 'religion',
      estimatedMinutes: 120,
    });
    slots.afternoon.push({
      name: 'Trek / drive down to base',
      time: '10:00–16:00',
      description: 'Descend to Sonprayag / Gaurikund or next stop.',
      category: 'trek',
    });
    return slots;
  }

  if (phase === 'darshan') {
    slots.morning.push({
      name: 'Temple darshan',
      time: '06:00–09:00',
      description: 'Main shrine visit — follow queue and timing advisories.',
      category: 'religion',
      estimatedMinutes: 120,
    });
    const p = pick(0);
    if (p) slots.afternoon.push({ ...p, time: '11:00–14:00' });
    const p2 = pick(1);
    if (p2) slots.evening.push({ ...p2, time: '16:00–18:00' });
    return slots;
  }

  const rotated = pick(0);
  if (rotated) {
    slots.morning.push({ ...rotated, time: '07:00–10:00' });
  }
  return slots;
}

function eventsFromSlots(slots) {
  const events = [];
  for (const [period, items] of Object.entries(slots)) {
    for (const p of items) {
      events.push({
        time: p.time || period,
        title: p.name,
        note: p.description,
        category: p.category,
        image: p.image,
        slot: period,
      });
    }
  }
  return events;
}

function estimateRouteKm(selectedDhams) {
  let total = 80;
  const coords = selectedDhams.map((k) => {
    const disp = displayNameForDham(k);
    return DHAM_COORDS[disp];
  });
  for (let i = 1; i < coords.length; i++) {
    if (coords[i - 1] && coords[i]) {
      total += haversineKm(
        coords[i - 1].lat,
        coords[i - 1].lon,
        coords[i].lat,
        coords[i].lon,
      );
    }
  }
  const keys = selectedDhams;
  for (let i = 1; i < keys.length; i++) {
    const edge = `${keys[i - 1]}-${keys[i]}`;
    if (DHAM_KM_BETWEEN[edge]) total = Math.max(total, DHAM_KM_BETWEEN[edge] * i);
  }
  return Math.round(total);
}

/**
 * @param {object} input planner fields
 * @param {object} [opts] { shuffleSeed, userProfile }
 */
export async function buildDynamicItinerary(input, opts = {}) {
  const {
    selectedDhams: rawDhams,
    startDate,
    numberOfDays,
    travelMode = 'road',
    budgetTier = 'moderate',
    groupSize = 1,
    specialNeeds = [],
    interests = ['spiritual'],
    shuffleSeed = 0,
  } = input;

  const selectedDhams = orderedDhams(
    rawDhams?.length ? rawDhams : [...DHAM_KEYS],
  );
  const requestedDays = Number(numberOfDays) || 10;
  const minTripDays = computeMinTripDays(selectedDhams, travelMode);
  const totalDays = Math.min(21, Math.max(2, requestedDays));
  const alerts = [];
  if (requestedDays < minTripDays) {
    alerts.push(
      `This route needs at least ${minTripDays} days (${selectedDhams.map(displayNameForDham).join(', ')}). Consider increasing trip length.`,
    );
  }
  const dataQuality = { weather: 'pending', crowd: 'pending', pois: 'pending' };

  const { weatherMap, alerts: weatherAlerts } = await fetchWeatherMapForDhams(
    startDate,
    totalDays + 2,
  );
  alerts.push(...weatherAlerts);
  dataQuality.weather = Object.values(weatherMap).some((d) =>
    Object.values(d).some((c) => c._source === 'openweather'),
  )
    ? 'live'
    : 'seasonal';

  const schedule = buildTripSchedule(selectedDhams, totalDays, travelMode);
  const dayDates = [];
  for (let i = 0; i < totalDays; i++) dayDates.push(addDaysUtc(startDate, i));

  const dhamPoiCache = {};
  for (const dham of selectedDhams) {
    dhamPoiCache[dham] = await loadDhamPois(dham, interests, shuffleSeed);
  }
  dataQuality.pois = Object.values(dhamPoiCache).some((c) => c.pois?.length)
    ? 'live'
    : 'fallback';

  const { crowdMap, alerts: crowdAlerts } = await fetchCrowdMapForTrip({
    startDate,
    dayDates,
    dhamKeys: selectedDhams,
    weatherMap,
  });
  alerts.push(...crowdAlerts);
  dataQuality.crowd = 'live';

  const totalKm = estimateRouteKm(selectedDhams);
  const heliSectors =
    travelMode === 'helicopter'
      ? selectedDhams.length
      : travelMode === 'mixed'
        ? Math.min(2, selectedDhams.length)
        : 0;

  const tripBudget = calculateTripBudget({
    travelMode,
    budgetTier,
    groupSize,
    numberOfDays: totalDays,
    totalKm,
    helicopterSectors: heliSectors,
  });

  const days = [];
  const kmPerTravelDay = Math.round(totalKm / Math.max(1, totalDays - 1));
  let poiOffset = 0;

  for (let i = 0; i < schedule.length; i++) {
    const seg = schedule[i];
    const date = dayDates[i];
    const dayNum = i + 1;

    const isPlains =
      seg.kind === 'arrival' || seg.kind === 'return' || seg.kind === 'buffer';
    const dhamKey = seg.dham || null;
    const display = dhamKey ? displayNameForDham(dhamKey) : null;
    const cache = dhamKey ? dhamPoiCache[dhamKey] || { pois: [], nearby: [] } : { pois: [], nearby: [] };

    const wx = isPlains
      ? attachWeather(weatherMap, 'Rishikesh', date, 'plains')
      : attachWeather(weatherMap, display, date, 'high');

    const crowdEntry = display ? crowdMap[display]?.byDate?.[date] : null;
    const crowdLevel = crowdEntry?.level || (display ? crowdMap[display]?.level : null) || null;
    const badge = crowdLevel ? crowdBadge(crowdLevel) : null;

    let warning = null;
    if (isBadWeather(wx.weather)) {
      warning = `Weather alert: ${wx.weather?.condition || 'poor conditions'} — carry rain gear; check road updates.`;
    }
    if (badge?.level === 'High' && display) {
      const alt1 = addDaysUtc(date, -2);
      const alt2 = addDaysUtc(date, 2);
      warning = [
        warning,
        `High crowd expected — consider ${alt1} or ${alt2} instead.`,
      ]
        .filter(Boolean)
        .join(' ');
    }

    const isHeliDay =
      dhamKey === 'kedarnath' &&
      (travelMode === 'helicopter' ||
        (travelMode === 'mixed' && seg.phase === 'darshan'));

    const isTrekLeg =
      dhamKey === 'kedarnath' &&
      (travelMode === 'trek' || travelMode === 'mixed') &&
      (seg.phase === 'ascent' || seg.phase === 'descent');

    const dayKm = isTrekLeg
      ? Math.round((DHAM_INFO.kedarnath?.trekDistance || 16) / (seg.phase === 'ascent' ? 1 : 1.2))
      : isPlains
        ? kmPerTravelDay
        : Math.round(kmPerTravelDay * 0.5);

    const est = dailyBudgetEstimate({
      travelMode,
      budgetTier,
      groupSize,
      dayKm,
      isHeliDay,
    });

    const slots = buildSlotsForPhase(seg, cache.pois, poiOffset);
    poiOffset += 1;

    const info = dhamKey ? DHAM_INFO[dhamKey] : null;
    const travelModeDay = isTrekLeg
      ? 'trek'
      : isHeliDay
        ? 'helicopter'
        : isPlains
          ? travelMode
          : travelMode;

    days.push({
      day: dayNum,
      date,
      title: seg.title,
      location: seg.location || (isPlains ? 'Haridwar / Rishikesh' : display),
      dham: display,
      dhamKey,
      phase: seg.phase || seg.kind,
      ...wx,
      weatherWarning: isBadWeather(wx.weather),
      snowWarning: String(wx.weather?.condition || '').toLowerCase().includes('snow'),
      crowdLevel: badge?.level || null,
      crowdBadge: badge,
      slots,
      events: eventsFromSlots(slots),
      travel: {
        mode: travelModeDay,
        distanceKm: dayKm,
        durationHours: isTrekLeg
          ? info?.trekDuration || 6
          : isHeliDay
            ? 1
            : Math.max(2, Math.round(dayKm / 30)),
        note: isTrekLeg
          ? seg.phase === 'ascent'
            ? `Trek up ~${info?.trekDistance || 16} km to shrine`
            : 'Trek down to road head'
          : undefined,
      },
      estimatedCost: est.perPerson,
      dailyBudget: est,
      nearbyExplore: dhamKey && seg.phase === 'darshan' ? cache.nearby || [] : [],
      warning,
      tip:
        seg.phase === 'ascent'
          ? 'Trek day — no main darshan until next morning at the shrine.'
          : specialNeeds.includes('seniors')
            ? 'Allow extra rest; avoid rushing altitude gain.'
            : info?.bestVisitTime === 'morning' && seg.phase === 'darshan'
              ? 'Visit shrine early for shorter queues.'
              : null,
    });
  }

  let bestWeatherDay = days[0];
  let worstWeatherDay = days[0];
  let busiestDay = null;
  for (const d of days) {
    if ((d.weather?.rainMm ?? 99) < (bestWeatherDay?.weather?.rainMm ?? 99)) {
      bestWeatherDay = d;
    }
    if ((d.weather?.rainMm ?? 0) > (worstWeatherDay?.weather?.rainMm ?? 0)) {
      worstWeatherDay = d;
    }
    if (d.crowdLevel === 'High' && !busiestDay) busiestDay = d;
  }

  const nearbyByDham = {};
  for (const k of selectedDhams) {
    nearbyByDham[k] = dhamPoiCache[k]?.nearby || [];
  }

  const insightsByDham = {};
  for (const k of selectedDhams) {
    insightsByDham[k] = {
      nearbyAttractions: (dhamPoiCache[k]?.nearby || []).map((p) => ({
        name: p.name,
        distance: p.distanceKm,
        type: p.category,
        description: p.description,
        image: p.image,
        xid: p.xid,
      })),
      alternatives: DHAM_INFO[k]?.crowdAlternatives || [],
    };
  }

  return {
    plannerVersion: 4,
    totalDays,
    suggestedMinDays: minTripDays,
    totalCostPerPerson: tripBudget.perPerson,
    totalCost: tripBudget.total,
    totalBudget: tripBudget,
    summary: `Dynamic ${totalDays}-day Char Dham plan covering ${selectedDhams.map(displayNameForDham).join(', ')}.`,
    weatherSummary: `Best weather around Day ${bestWeatherDay?.day} (${bestWeatherDay?.date}); watch Day ${worstWeatherDay?.day} for rain.`,
    crowdSummary: busiestDay
      ? `Busiest crowd expected on Day ${busiestDay.day} at ${busiestDay.dham}.`
      : 'Crowd levels mostly moderate across the trip.',
    selectedDhams,
    dhamOrder: selectedDhams,
    days,
    nearbyByDham,
    insightsByDham,
    alerts: [...new Set(alerts)],
    dataQuality,
    inputSnapshot: {
      startDate,
      numberOfDays: totalDays,
      travelMode,
      budgetTier,
      groupSize,
      specialNeeds,
      interests,
    },
  };
}

/** Map legacy mobile payload → dynamic planner input */
export function normalizePlannerInput(body) {
  if (body.numberOfDays != null) {
    return {
      selectedDhams: (body.selectedDhams || DHAM_KEYS).map((d) =>
        String(d).toLowerCase(),
      ),
      startDate: body.startDate,
      numberOfDays: body.numberOfDays,
      travelMode: body.travelMode || 'road',
      budgetTier: body.budgetTier || 'moderate',
      groupSize: body.groupSize || 1,
      specialNeeds: body.specialNeeds || [],
      interests: body.interests?.length ? body.interests : ['spiritual'],
      shuffleSeed: body.shuffleSeed || 0,
    };
  }

  const accommodation = body.accommodation || 'midrange';
  const budgetTier =
    accommodation === 'budget'
      ? 'budget'
      : accommodation === 'premium'
        ? 'premium'
        : 'moderate';

  let travelMode = body.travelMode || 'road';
  if (body.kedarnathTravel === 'trek' && travelMode === 'road') {
    travelMode = 'mixed';
  }
  if (body.kedarnathTravel === 'helicopter') {
    travelMode = travelMode === 'road' ? 'mixed' : travelMode;
  }

  const paceDays = {
    relaxed: body.mode === 'single' ? 4 : 13,
    moderate: body.mode === 'single' ? 3 : 10,
    express: body.mode === 'single' ? 2 : 7,
  };

  const selected =
    body.selectedDhams?.length > 0
      ? body.selectedDhams
      : body.mode === 'single'
        ? ['kedarnath']
        : [...DHAM_KEYS];

  const specialNeeds = [];
  if (body.specialNeeds?.length) {
    specialNeeds.push(...body.specialNeeds);
  }

  return {
    selectedDhams: selected.map((d) => String(d).toLowerCase()),
    startDate: body.startDate,
    numberOfDays: Math.min(21, Math.max(2, paceDays[body.pace] || 10)),
    travelMode,
    budgetTier,
    groupSize: body.groupSize || 1,
    specialNeeds,
    interests: body.interests?.length ? body.interests : ['spiritual'],
    shuffleSeed: body.shuffleSeed || 0,
  };
}
