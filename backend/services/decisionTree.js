/**
 * Enhanced Char Dham itinerary decision tree (single + all4 modes).
 */
import {
  DHAM_INFO,
  YEARLY_OPENING_DATES,
  DHAM_KEYS,
  displayNameForDham,
} from '../constants/dhamData.js';

const DHAM_DISPLAY_ORDER = ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'];
const KEY_TO_DISPLAY = {
  yamunotri: 'Yamunotri',
  gangotri: 'Gangotri',
  kedarnath: 'Kedarnath',
  badrinath: 'Badrinath',
};

const ACC_COST = {
  budget: { accommodation: 800, meals: 400, local: 300 },
  midrange: { accommodation: 2000, meals: 700, local: 500 },
  premium: { accommodation: 5000, meals: 1200, local: 800 },
};

function normLevel(l) {
  if (!l) return 'Medium';
  const s = String(l);
  const x = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  if (x === 'Low' || x === 'High' || x === 'Medium') return x;
  return 'Medium';
}

export function addDaysStr(startStr, n) {
  const d = new Date(`${startStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function parseYmd(s) {
  const [y, m, day] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
}

function openingDateUtc(year, dhamKey) {
  const ann = YEARLY_OPENING_DATES[year]?.[dhamKey];
  if (ann) return parseYmd(ann);
  const { month, day } = DHAM_INFO[dhamKey].openingDate;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function closingDateUtc(year, dhamKey) {
  const { month, day } = DHAM_INFO[dhamKey].closingDate;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * @param {string[]} selectedDhams lowercase keys
 * @param {string} startDateStr
 * @param {number} year
 * @param {{ mode: string, pace: string, sideTrips: boolean }} opts
 */
export function validateDhamDates(selectedDhams, startDateStr, year, opts = {}) {
  const warnings = [];
  const closedDhams = [];
  const mode = opts.mode || 'all4';
  const pace = opts.pace || 'moderate';
  const sideTrips = !!opts.sideTrips;
  const totalDays =
    mode === 'single'
      ? singleTripDays(selectedDhams[0], pace)
      : computeTotalDays(pace, sideTrips);

  const visitOffset = (dhamKey) => {
    if (mode === 'single') {
      const m = {
        yamunotri: 1,
        gangotri: 1,
        kedarnath: 2,
        badrinath: 1,
      };
      return m[dhamKey] ?? 1;
    }
    const ratio = {
      yamunotri: 0.12,
      gangotri: 0.32,
      kedarnath: 0.55,
      badrinath: 0.78,
    };
    return Math.max(
      0,
      Math.min(totalDays - 1, Math.floor((ratio[dhamKey] ?? 0.5) * totalDays)),
    );
  };

  for (const dhamKey of selectedDhams) {
    const k = String(dhamKey).toLowerCase();
    if (!DHAM_INFO[k]) continue;
    const open = openingDateUtc(year, k);
    const close = closingDateUtc(year, k);
    const visitStr = addDaysStr(startDateStr, visitOffset(k));
    const visit = parseYmd(visitStr);
    if (visit < open || visit > close) {
      closedDhams.push({
        dham: k,
        displayName: DHAM_INFO[k].displayName,
        visitDate: visitStr,
        openingDate: iso(open),
        closingDate: iso(close),
      });
    }
  }

  return {
    valid: closedDhams.length === 0,
    closedDhams,
    warnings,
  };
}

export function checkCrowdAndSuggestAlternatives(dhamKey, crowdLevel, _date) {
  const k = String(dhamKey).toLowerCase();
  const info = DHAM_INFO[k];
  if (!info) {
    return { tip: 'Plan ahead for mountain weather.', nearbyAttractions: [] };
  }
  const level = normLevel(crowdLevel);
  if (level === 'High') {
    return {
      warning:
        `${info.displayName} is very crowded on your travel dates. Consider visiting on a weekday or adjust by 2-3 days.`,
      alternatives: info.crowdAlternatives,
      nearbyAttractions: info.nearbyAttractions,
      suggestion:
        'You can visit a nearby alternative while the main shrine is busiest.',
    };
  }
  if (level === 'Medium') {
    return {
      tip: 'Moderate crowd expected. Arrive by 5am for darshan without long wait.',
      nearbyAttractions: info.nearbyAttractions,
    };
  }
  return {
    tip: 'Great time to visit — low crowd expected.',
    nearbyAttractions: info.nearbyAttractions,
  };
}

function dailyBaseCost(accommodation) {
  const tier =
    accommodation === 'budget' || accommodation === 'midrange' || accommodation === 'premium'
      ? accommodation
      : 'midrange';
  const c = ACC_COST[tier];
  return c.accommodation + c.meals + c.local;
}

function weatherForDhamOnDate(weatherMap, dhamDisplay, dateStr) {
  const m = weatherMap[dhamDisplay]?.[dateStr];
  if (m) {
    return {
      avgTempC: m.avgTempC ?? 10,
      condition: m.condition ?? 'Clouds',
      rainMm: m.rainMm ?? 0,
      windKmh: m.windKmh ?? 15,
    };
  }
  return { avgTempC: 10, condition: 'Clouds', rainMm: 0, windKmh: 15 };
}

export function computeTotalDays(pace, sideTrips) {
  const base = { relaxed: 13, moderate: 10, express: 7 }[pace] ?? 10;
  return base + (sideTrips ? 2 : 0);
}

function singleTripDays(dhamKey, pace) {
  const k = String(dhamKey).toLowerCase();
  const isKed = k === 'kedarnath';
  if (pace === 'express') return isKed ? 2 : 2;
  if (pace === 'moderate') return isKed ? 3 : 2;
  return isKed ? 4 : 3;
}

export function computeDhamOrder(crowdMap) {
  const alerts = [];
  const k = normLevel(crowdMap.Kedarnath?.level);
  const b = normLevel(crowdMap.Badrinath?.level);
  const all = DHAM_DISPLAY_ORDER.map((d) => normLevel(crowdMap[d]?.level));

  let order = [...DHAM_DISPLAY_ORDER];
  if (k === 'High' && (b === 'Low' || b === 'Medium')) {
    order = ['Yamunotri', 'Gangotri', 'Badrinath', 'Kedarnath'];
    alerts.push(
      'Kedarnath crowd is high on your dates. We have swapped the order to visit Badrinath first and Kedarnath later for a better experience.',
    );
  } else if (all.every((x) => x === 'High')) {
    alerts.push(
      'All Dhams show high crowd levels — start each day early and book stays in advance.',
    );
  }
  return { order, alerts };
}

export function resolveKedarnathTravel(userProfile, requestBody) {
  const hw = [];
  const age = userProfile.age ?? 40;
  const h = new Set(userProfile.healthConditions || []);

  let mode = 'trek';
  const reqMode = requestBody.kedarnathTravel || 'auto';
  const circuit = requestBody.travelMode || 'road';

  if (reqMode === 'helicopter') mode = 'helicopter';
  else if (reqMode === 'pony') mode = 'pony';

  if (age >= 60 && (h.has('heartCondition') || h.has('highBP') || h.has('heart'))) {
    mode = 'helicopter';
    hw.push(
      'Based on your health profile and age, we strongly recommend helicopter service for Kedarnath.',
    );
  } else if (age >= 55 || h.has('kneePain') || h.has('knee')) {
    if (mode === 'trek' && reqMode === 'auto') {
      mode = 'pony';
    }
    hw.push('Pony or palki service recommended for Kedarnath trek given your health profile.');
  } else if (circuit === 'helicopter' || reqMode === 'helicopter') {
    mode = 'helicopter';
  }

  return { mode, healthWarnings: hw };
}

function enrichDayRow(
  row,
  weatherMap,
  crowdMap,
  kedarnathMode,
  travelModeCircuit,
  paceKey,
  alerts,
  healthWarnings,
  fitnessLevel,
  age,
  groupSize,
  vehicle,
) {
  const dham = row.dham;
  const w = dham
    ? weatherForDhamOnDate(weatherMap, dham, row.date)
    : { avgTempC: 12, condition: 'Clouds', rainMm: 0, windKmh: 18 };

  let crowdLevel = null;
  if (dham && crowdMap[dham]) {
    crowdLevel = normLevel(crowdMap[dham].level);
  }

  let warning = null;
  let tip = null;

  if (w.condition === 'Thunderstorm' || (w.rainMm ?? 0) > 20) {
    warning =
      'Heavy rain/thunderstorm forecast. Carry waterproof gear. Check road status before departing.';
    if (dham === 'Kedarnath') warning += ' Trek routes may be slippery — extra caution.';
    alerts.push(`Severe weather risk on ${row.date} near ${dham || 'hills'}.`);
  }
  if (w.condition === 'Snow' && (dham === 'Kedarnath' || dham === 'Yamunotri')) {
    warning =
      (warning ? `${warning} ` : '') +
      'Snowfall expected. Temple may have restricted hours. Carry warm layers.';
  }
  if ((w.avgTempC ?? 20) < 5) {
    tip = 'Temperature below 5°C. Pack thermal innerwear, gloves, and a windproof jacket.';
  }
  if ((w.windKmh ?? 0) > 40 && travelModeCircuit === 'helicopter') {
    warning =
      (warning ? `${warning} ` : '') +
      'High wind — helicopter flights may be cancelled. Keep buffer day.';
  }

  if (dham === 'Kedarnath' && kedarnathMode === 'pony') {
    row.events = (row.events || []).map((e) => ({
      ...e,
      note: `${e.note || ''} Pony/palki option reserved per health profile.`.trim(),
    }));
  }

  if (fitnessLevel === 'active' && age < 30 && dham === 'Gangotri') {
    tip = (tip ? `${tip} ` : '') + 'Optional: Gaumukh glacier day trek with local permit.';
  }
  if (groupSize > 4) {
    tip = (tip ? `${tip} ` : '') + 'Large group: book hotel blocks early; shared taxi saves cost.';
  }
  if (vehicle?.type || vehicle?.vehicleType) {
    tip =
      (tip ? `${tip} ` : '') +
      'Parking: Sonprayag for Kedarnath; Badrinath has main parking near bus stand.';
  }

  let cost = row.estimatedCost ?? dailyBaseCost('midrange');
  if (dham === 'Kedarnath') {
    if (kedarnathMode === 'helicopter') cost += 12000 / Math.max(1, paceKey === 'express' ? 7 : paceKey === 'relaxed' ? 13 : 10);
    else if (kedarnathMode === 'pony') cost += 2500 / Math.max(1, paceKey === 'express' ? 7 : 10);
  }

  return {
    day: row.day,
    date: row.date,
    title: row.title,
    location: row.location,
    dham,
    weather: {
      avgTempC: w.avgTempC,
      condition: w.condition,
      rainMm: w.rainMm,
    },
    crowdLevel,
    events: row.events || [],
    estimatedCost: Math.round(cost),
    warning,
    tip,
    dhamNotes: row.dhamNotes || null,
  };
}

function crowdKeyToDisplay(key) {
  return KEY_TO_DISPLAY[key] || key;
}

function buildCrowdMapForKeys(crowdMap, keys) {
  const out = {};
  for (const k of keys) {
    const disp = crowdKeyToDisplay(k);
    out[disp] = crowdMap[disp] || crowdMap[k] || crowdMap[k.charAt(0).toUpperCase() + k.slice(1)];
  }
  return { ...crowdMap, ...out };
}

export function buildSingleDhamPlan(
  dhamKey,
  startDate,
  userProfile,
  requestBody,
  weatherMap,
  crowdMap,
) {
  const k = String(dhamKey).toLowerCase();
  const info = DHAM_INFO[k];
  if (!info) {
    throw new Error(`Unknown dham: ${dhamKey}`);
  }
  const pace = requestBody.pace || 'moderate';
  const n = singleTripDays(k, pace);
  const { mode: kedMode, healthWarnings } = resolveKedarnathTravel(userProfile, requestBody);
  const alerts = [];
  const rows = [];

  const push = (i, title, location, dham, events, est, dhamNotes) => {
    rows.push({
      day: i + 1,
      date: addDaysStr(startDate, i),
      title,
      location,
      dham,
      events,
      estimatedCost: est,
      dhamNotes,
    });
  };

  if (k === 'yamunotri') {
    push(0, 'Journey to Yamunotri base', 'Dehradun / Haridwar → Barkot', null, [{ time: '10:00', title: 'Road journey', note: 'Acclimatisation' }], dailyBaseCost(requestBody.accommodation));
    push(1, 'Trek day — Yamunotri Dham', 'Janki Chatti → Yamunotri', 'Yamunotri', [{ time: '05:00', title: 'Pre-dawn trek', note: `${info.darshaTiming} · pony optional` }, { time: '12:00', title: 'Darshan & Surya Kund', note: 'Hot spring near temple' }], dailyBaseCost(requestBody.accommodation), 'Trek ~6km / ~3h one way from Janki Chatti');
    push(2, 'Return / rest', 'Barkot / Janki Chatti', null, [{ time: '09:00', title: 'Rest or Kharsali village', note: 'Less crowded alternative' }], dailyBaseCost(requestBody.accommodation) * 0.85);
  } else if (k === 'gangotri') {
    push(0, 'Journey to Gangotri sector', 'Uttarkashi', null, [{ time: '12:00', title: 'Road via Uttarkashi', note: `Mandatory night halt: ${info.mandatoryStopover}` }], dailyBaseCost(requestBody.accommodation));
    push(1, 'Gangotri Dham', 'Gangotri town', 'Gangotri', [{ time: '05:30', title: 'Aarti', note: info.darshaTiming }, { time: '09:00', title: 'Bhagirathi Shila', note: 'Short walk from temple' }], dailyBaseCost(requestBody.accommodation));
    push(2, 'Buffer / return', 'Uttarkashi', null, [{ time: '10:00', title: 'Rest day', note: '' }], dailyBaseCost(requestBody.accommodation) * 0.9);
  } else if (k === 'kedarnath') {
    push(0, 'Journey to Kedarnath base', 'Guptkashi / Rudraprayag', null, [{ time: '14:00', title: 'Check-in', note: info.mandatoryStopover }], dailyBaseCost(requestBody.accommodation));
    push(1, 'Sonprayag → Gaurikund', 'Sonprayag', 'Kedarnath', [{ time: '07:00', title: 'Park & shared jeep', note: 'Park at Sonprayag. Private vehicles NOT allowed beyond Sonprayag to Gaurikund.' }], dailyBaseCost(requestBody.accommodation), 'Sonprayag mandatory parking');
    const ascent =
      kedMode === 'helicopter'
        ? [{ time: '06:00', title: 'Helicopter from Phata/Sersi', note: `Approx ₹${DHAM_INFO.kedarnath.helicopterPrice} per person` }]
        : [{ time: '06:00', title: 'Trek start Gaurikund', note: '16km · ~6h · carry water' }];
    push(2, 'Kedarnath darshan', 'Kedarnath shrine', 'Kedarnath', [...ascent, { time: '15:00', title: 'Bhairavnath / buffer', note: 'Gandhi Sarovar if time & fitness allow' }], dailyBaseCost(requestBody.accommodation) * 1.15, kedMode === 'helicopter' ? 'Helipad: Phata / Sersi / Guptkashi' : null);
    push(3, 'Descent & recovery', 'Gaurikund / Guptkashi', 'Kedarnath', [{ time: '08:00', title: 'Descent / rest', note: 'Hydration' }], dailyBaseCost(requestBody.accommodation) * 0.9);
  } else {
    push(0, 'Journey to Joshimath', 'Joshimath', null, [{ time: '15:00', title: 'Road from Rishikesh', note: `Mandatory halt: ${info.mandatoryStopover}` }], dailyBaseCost(requestBody.accommodation));
    push(1, 'Badrinath darshan', 'Badrinath town', 'Badrinath', [{ time: '04:30', title: 'Tapt Kund holy dip', note: 'Before darshan as per tradition' }, { time: '06:00', title: 'Temple darshan', note: info.darshaTiming }], dailyBaseCost(requestBody.accommodation), 'Brahma Muhurta abhishek ~04:30');
    push(2, 'Mana / Vyas Gufa (optional)', 'Mana', 'Badrinath', [{ time: '09:00', title: 'Side visit', note: requestBody.sideTrips ? 'Mana, Vyas Gufa' : 'Rest' }], dailyBaseCost(requestBody.accommodation) * 0.85);
  }

  const crowdDisp = crowdKeyToDisplay(k);
  const level = normLevel(crowdMap[crowdDisp]?.level || crowdMap[k]?.level);
  const crowdInsight = checkCrowdAndSuggestAlternatives(k, level, startDate);
  if (crowdInsight.warning) alerts.push(crowdInsight.warning);

  const cm = buildCrowdMapForKeys(crowdMap, [k]);
  const trimmed = rows.slice(0, n);
  const days = trimmed.map((row, idx) =>
    enrichDayRow(
      {
        ...row,
        day: idx + 1,
        date: addDaysStr(startDate, idx),
      },
      weatherMap,
      cm,
      kedMode,
      requestBody.travelMode,
      pace,
      alerts,
      healthWarnings,
      userProfile.fitnessLevel,
      userProfile.age ?? 40,
      requestBody.groupSize || 1,
      userProfile.vehicle,
    ),
  );

  let totalCostPerPerson = days.reduce((s, d) => s + (d.estimatedCost || 0), 0);
  const budgetCap = Number(requestBody.budget) || 500000;
  if (budgetCap > 0 && totalCostPerPerson > budgetCap) {
    alerts.push('Estimated spend may exceed budget — review accommodation tier.');
  }

  const summary = `${userProfile.name || 'Pilgrim'}, your ${n}-day ${info.displayName} plan (${pace}). ${crowdInsight.tip || crowdInsight.warning || ''}`;

  return {
    mode: 'single',
    selectedDhams: [k],
    totalDays: n,
    totalCostPerPerson: Math.round(totalCostPerPerson),
    summary: summary.trim(),
    alerts,
    healthWarnings,
    weatherSummary: `Mountain weather — check ${info.displayName} sector forecast daily.`,
    closedDhamWarnings: [],
    days,
    insightsByDham: { [k]: crowdInsight },
    kedarnathMode: kedMode,
  };
}

export function buildAll4DhamPlan(
  startDate,
  userProfile,
  requestBody,
  weatherMap,
  crowdMap,
) {
  const pace = requestBody.pace || 'moderate';
  const sideTrips = !!requestBody.sideTrips;
  const totalDays = computeTotalDays(pace, sideTrips);
  const { order, alerts } = computeDhamOrder(crowdMap);
  const { mode: kedMode, healthWarnings } = resolveKedarnathTravel(userProfile, requestBody);

  const skeleton = [];
  const push = (title, location, dham, events, est, dhamNotes) => {
    skeleton.push({ title, location, dham, events, estimatedCost: est, dhamNotes });
  };

  push('Haridwar / Rishikesh arrival', 'Haridwar', null, [{ time: '14:00', title: 'Check-in', note: 'Evening Ganga aarti' }], dailyBaseCost(requestBody.accommodation));
  push('Drive to Janki Chatti (Yamunotri base)', 'Barkot / Janki Chatti', null, [{ time: '07:00', title: 'Road journey', note: 'Acclimatisation' }], dailyBaseCost(requestBody.accommodation));
  push('Yamunotri darshan + nearby', 'Yamunotri', 'Yamunotri', [{ time: '05:00', title: 'Trek / pony', note: DHAM_INFO.yamunotri.darshaTiming }, { time: '14:00', title: 'Surya Kund', note: 'If crowd low' }], dailyBaseCost(requestBody.accommodation));
  push('Drive to Uttarkashi', 'Uttarkashi', null, [{ time: '08:00', title: 'Scenic drive', note: DHAM_INFO.gangotri.mandatoryStopover }], dailyBaseCost(requestBody.accommodation));
  push('Gangotri darshan', 'Gangotri', 'Gangotri', [{ time: '05:30', title: 'Aarti', note: 'Bhagirathi Shila' }], dailyBaseCost(requestBody.accommodation));
  if (sideTrips && pace === 'relaxed') {
    push('Gaumukh day trek (optional)', 'Gangotri → Gaumukh', 'Gangotri', [{ time: '05:00', title: 'Permit & trek', note: 'For active fitness only' }], dailyBaseCost(requestBody.accommodation) * 1.2);
  }
  push('Drive to Guptkashi / Rudraprayag', 'Guptkashi', null, [{ time: '07:00', title: 'Mountain road', note: 'Rest evening' }], dailyBaseCost(requestBody.accommodation));
  push('Sonprayag / Gaurikund', 'Sonprayag', 'Kedarnath', [{ time: '08:00', title: 'Parking & shared jeep', note: 'Park at Sonprayag. Private vehicles NOT allowed beyond Sonprayag to Gaurikund.' }], dailyBaseCost(requestBody.accommodation), 'Mandatory Sonprayag parking');
  const kedEvents =
    kedMode === 'helicopter'
      ? [{ time: '06:00', title: 'Helicopter', note: 'Phata / Sersi helipad' }]
      : [{ time: '06:00', title: 'Trek from Gaurikund', note: '16km · ~6h' }];
  push('Kedarnath ascent & darshan', 'Kedarnath', 'Kedarnath', [...kedEvents, { time: '16:00', title: 'Descent buffer', note: 'Gandhi Sarovar if time' }], dailyBaseCost(requestBody.accommodation) * 1.1);
  push('Descent & drive towards Joshimath', 'Joshimath', null, [{ time: '09:00', title: 'Road', note: 'Acclimatisation' }], dailyBaseCost(requestBody.accommodation));
  if (pace === 'relaxed') {
    push('Joshimath + Auli buffer', 'Joshimath', null, [{ time: '10:00', title: 'Rest / cable car', note: '' }], dailyBaseCost(requestBody.accommodation) * 0.95);
  }
  push('Badrinath darshan', 'Badrinath', 'Badrinath', [{ time: '04:30', title: 'Tapt Kund dip', note: 'Before darshan' }, { time: '06:00', title: 'Abhishek darshan', note: DHAM_INFO.badrinath.darshaTiming }], dailyBaseCost(requestBody.accommodation));
  if (sideTrips) {
    push('Mana · Vyas Gufa', 'Mana', 'Badrinath', [{ time: '09:00', title: 'Side trip', note: 'Last Indian village' }], dailyBaseCost(requestBody.accommodation) * 0.6);
    if (pace === 'relaxed') {
      push('Valley of Flowers / Hemkund window', 'Gobindghat', null, [{ time: '05:00', title: 'Optional trek', note: 'July–Aug bloom' }], dailyBaseCost(requestBody.accommodation) * 0.7);
    }
  }
  push('Return journey', 'Haridwar / Delhi', null, [{ time: '08:00', title: 'Departure', note: '' }], dailyBaseCost(requestBody.accommodation) * 0.75);

  while (skeleton.length < totalDays) {
    skeleton.splice(skeleton.length - 1, 0, {
      title: 'Rest / buffer',
      location: 'Uttarakhand',
      dham: null,
      events: [{ time: '10:00', title: 'Flexible', note: 'Adjust pace' }],
      estimatedCost: dailyBaseCost(requestBody.accommodation) * 0.85,
    });
  }
  while (skeleton.length > totalDays) {
    skeleton.pop();
  }

  const days = skeleton.map((r, i) =>
    enrichDayRow(
      { ...r, day: i + 1, date: addDaysStr(startDate, i) },
      weatherMap,
      crowdMap,
      kedMode,
      requestBody.travelMode,
      pace,
      alerts,
      healthWarnings,
      userProfile.fitnessLevel,
      userProfile.age ?? 40,
      requestBody.groupSize || 1,
      userProfile.vehicle,
    ),
  );

  const insightsByDham = {};
  for (const key of DHAM_KEYS) {
    const disp = KEY_TO_DISPLAY[key];
    const level = normLevel(crowdMap[disp]?.level);
    insightsByDham[key] = checkCrowdAndSuggestAlternatives(key, level, startDate);
  }

  let totalCostPerPerson = days.reduce((s, d) => s + (d.estimatedCost || 0), 0);
  const accTier = requestBody.accommodation || 'midrange';
  const ratioMid = dailyBaseCost('midrange');
  const ratioTarget = dailyBaseCost(accTier);
  const costScale = ratioMid > 0 ? ratioTarget / ratioMid : 1;
  for (const d of days) {
    d.estimatedCost = Math.round((d.estimatedCost || 0) * costScale);
  }
  totalCostPerPerson = days.reduce((s, d) => s + (d.estimatedCost || 0), 0);

  const budgetCap = Number(requestBody.budget) || 500000;
  if (budgetCap > 0 && totalCostPerPerson > budgetCap) {
    alerts.push(
      `Estimated spend (₹${totalCostPerPerson.toLocaleString('en-IN')}) may exceed budget (₹${budgetCap.toLocaleString('en-IN')}).`,
    );
  }

  const summary = `${userProfile.name || 'Pilgrim'}, your ${totalDays}-day Char Dham plan (${pace}) follows ${order.join(' → ')}. Includes Kedarnath travel: ${kedMode}.`;

  return {
    mode: 'all4',
    selectedDhams: [...DHAM_KEYS],
    totalDays,
    totalCostPerPerson: Math.round(totalCostPerPerson),
    summary,
    alerts: [...new Set(alerts)].filter(Boolean),
    healthWarnings: [...new Set(healthWarnings)].filter(Boolean),
    weatherSummary: 'Mixed mountain weather — layers; monsoon readiness June–Aug.',
    closedDhamWarnings: [],
    days,
    insightsByDham,
    kedarnathMode: kedMode,
    dhamOrder: order,
  };
}

/**
 * @param {object} userProfile
 * @param {object} requestBody
 * @param {object} weatherMap
 * @param {object} crowdMap
 */
export function generateItinerary(userProfile, requestBody, weatherMap, crowdMap) {
  const mode = requestBody.mode === 'single' ? 'single' : 'all4';
  const selectedDhams = (
    requestBody.selectedDhams?.length
      ? requestBody.selectedDhams
      : mode === 'single'
        ? ['kedarnath']
        : [...DHAM_KEYS]
  ).map((d) => String(d).toLowerCase());

  const startDate = requestBody.startDate;
  const year = new Date(`${startDate}T12:00:00.000Z`).getUTCFullYear();

  if (mode === 'single') {
    return buildSingleDhamPlan(
      selectedDhams[0],
      startDate,
      userProfile,
      requestBody,
      weatherMap,
      crowdMap,
    );
  }
  return buildAll4DhamPlan(startDate, userProfile, requestBody, weatherMap, crowdMap);
}
