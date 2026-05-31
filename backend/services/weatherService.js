import axios from 'axios';

/** Shrine coordinates (high altitude) */
export const DHAM_COORDS = {
  Yamunotri: { lat: 30.9993, lon: 78.4546, altitude: 'high' },
  Gangotri: { lat: 30.9946, lon: 78.9394, altitude: 'high' },
  Kedarnath: { lat: 30.7346, lon: 79.0669, altitude: 'high' },
  Badrinath: { lat: 30.7433, lon: 79.4938, altitude: 'high' },
};

/** Plains / base towns — use for arrival & return days */
export const PLAINS_COORDS = {
  Rishikesh: { lat: 30.0869, lon: 78.2676, altitude: 'plains' },
};

const ALL_LOCATIONS = { ...PLAINS_COORDS, ...DHAM_COORDS };

/** High-altitude seasonal (month 1–12) */
const SEASONAL_HIGH = {
  5: { avgTempC: 14, condition: 'Clear', rainMm: 8, windKmh: 12 },
  6: { avgTempC: 16, condition: 'Rain', rainMm: 45, windKmh: 14 },
  7: { avgTempC: 15, condition: 'Rain', rainMm: 80, windKmh: 12 },
  8: { avgTempC: 15, condition: 'Rain', rainMm: 70, windKmh: 12 },
  9: { avgTempC: 14, condition: 'Clouds', rainMm: 25, windKmh: 14 },
  10: { avgTempC: 10, condition: 'Clouds', rainMm: 12, windKmh: 18 },
  11: { avgTempC: 6, condition: 'Snow', rainMm: 5, windKmh: 22 },
};

/** Rishikesh / Haridwar belt — much warmer */
const SEASONAL_PLAINS = {
  5: { avgTempC: 32, condition: 'Clear', rainMm: 5, windKmh: 10 },
  6: { avgTempC: 34, condition: 'Rain', rainMm: 35, windKmh: 12 },
  7: { avgTempC: 30, condition: 'Rain', rainMm: 60, windKmh: 10 },
  8: { avgTempC: 29, condition: 'Rain', rainMm: 55, windKmh: 10 },
  9: { avgTempC: 28, condition: 'Clouds', rainMm: 20, windKmh: 12 },
  10: { avgTempC: 26, condition: 'Clear', rainMm: 8, windKmh: 14 },
  11: { avgTempC: 22, condition: 'Clear', rainMm: 4, windKmh: 14 },
};

const DEFAULT_HIGH = {
  avgTempC: 12,
  condition: 'Clouds',
  rainMm: 15,
  windKmh: 16,
  _source: 'seasonal',
};

const DEFAULT_PLAINS = {
  avgTempC: 28,
  condition: 'Clear',
  rainMm: 8,
  windKmh: 12,
  _source: 'seasonal',
};

export function weatherMainToCode(main) {
  const m = String(main || '').toLowerCase();
  if (m.includes('thunder')) return 95;
  if (m.includes('drizzle')) return 51;
  if (m.includes('rain')) return 61;
  if (m.includes('snow')) return 71;
  if (m.includes('clear')) return 0;
  if (m.includes('cloud')) return 3;
  if (m.includes('mist') || m.includes('fog')) return 45;
  return 1;
}

/** YYYY-MM-DD in India (IST) */
export function toIstDateKey(unixSecOrMs) {
  const ms =
    typeof unixSecOrMs === 'number' && unixSecOrMs < 1e12
      ? unixSecOrMs * 1000
      : unixSecOrMs;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date(ms));
}

/** Hour 0–23 in IST */
function istHour(unixSec) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date(unixSec * 1000));
  const h = parts.find((p) => p.type === 'hour')?.value ?? '12';
  return parseInt(h, 10);
}

function seasonalDayForDate(dateStr, altitude = 'high') {
  const month = Number(String(dateStr).slice(5, 7));
  const table = altitude === 'plains' ? SEASONAL_PLAINS : SEASONAL_HIGH;
  const base = table[month] || (altitude === 'plains' ? DEFAULT_PLAINS : DEFAULT_HIGH);
  return { ...base, _source: 'seasonal' };
}

function dateKeysFromStart(startDateStr, numDays) {
  const keys = [];
  for (let i = 0; i < numDays; i++) {
    keys.push(addDaysUtc(startDateStr, i));
  }
  return keys;
}

function addDaysUtc(startStr, n) {
  const d = new Date(`${startStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dominantCondition(items) {
  const counts = {};
  for (const item of items) {
    const c = item.weather?.[0]?.main ?? 'Clouds';
    counts[c] = (counts[c] || 0) + 1;
  }
  const priority = ['Thunderstorm', 'Snow', 'Rain', 'Drizzle', 'Clouds', 'Clear', 'Mist'];
  let best = 'Clouds';
  let bestScore = -1;
  for (const [c, n] of Object.entries(counts)) {
    const pri = priority.indexOf(c);
    const score = n * 10 + (pri >= 0 ? 10 - pri : 0);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/**
 * OpenWeather 3h forecast → per-day stats keyed by IST calendar date.
 */
function aggregateForecastByDate(list, dateKeys, altitude = 'high') {
  const byDate = {};
  for (const item of list || []) {
    const dt = item.dt ?? 0;
    const key = toIstDateKey(dt);
    const hour = istHour(dt);
    if (!byDate[key]) {
      byDate[key] = { temps: [], rains: [], pops: [], items: [] };
    }
    byDate[key].items.push(item);
    if (hour >= 6 && hour <= 20) {
      byDate[key].temps.push(item.main?.temp ?? 12);
    }
    const r3 = item.rain?.['3h'] ?? item.rain?.['1h'] ?? 0;
    byDate[key].rains.push(typeof r3 === 'number' ? r3 : 0);
    if (typeof item.pop === 'number') {
      byDate[key].pops.push(item.pop);
    }
  }

  const weatherMapForLocation = {};
  const todayIst = toIstDateKey(Date.now() / 1000);
  const todayMs = new Date(`${todayIst}T12:00:00+05:30`).getTime();

  for (const key of dateKeys) {
    const agg = byDate[key];
    const tripDayMs = new Date(`${key}T12:00:00+05:30`).getTime();
    const daysFromToday = Math.round((tripDayMs - todayMs) / 86400000);

    if (agg && agg.temps.length) {
      const temps = agg.temps.length ? agg.temps : agg.items.map((i) => i.main?.temp ?? 12);
      const avgTempC = temps.reduce((a, b) => a + b, 0) / temps.length;
      const rainMm = agg.rains.reduce((a, b) => a + b, 0);
      const condition = dominantCondition(agg.items);
      const windItem = agg.items[Math.floor(agg.items.length / 2)];
      const windKmh = (windItem?.wind?.speed ?? 4) * 3.6;
      const popMax =
        agg.pops.length > 0
          ? Math.round(Math.max(...agg.pops) * 100)
          : Math.min(90, Math.round(rainMm * 2));
      weatherMapForLocation[key] = {
        avgTempC: Math.round(avgTempC * 10) / 10,
        condition,
        rainMm: Math.round(rainMm * 10) / 10,
        rainChance: popMax,
        windKmh: Math.round(windKmh * 10) / 10,
        weatherCode: weatherMainToCode(condition),
        _source: 'openweather',
        _forecastDayOffset: daysFromToday,
      };
    } else if (daysFromToday >= 0 && daysFromToday <= 5) {
      weatherMapForLocation[key] = {
        ...seasonalDayForDate(key, altitude),
        rainChance: seasonalDayForDate(key, altitude).rainMm > 20 ? 60 : 25,
        _note: 'No forecast slot — seasonal fill',
      };
    } else {
      weatherMapForLocation[key] = {
        ...seasonalDayForDate(key, altitude),
        rainChance:
          seasonalDayForDate(key, altitude).rainMm > 20
            ? 55
            : 20,
        _note:
          daysFromToday > 5
            ? 'Trip date beyond 5-day forecast'
            : 'Past date — seasonal norm',
      };
    }
  }
  return weatherMapForLocation;
}

export function buildSeasonalWeatherMap(startDateStr, numDays = 12) {
  const weatherMap = {};
  const dateKeys = dateKeysFromStart(startDateStr, numDays);
  for (const [name, meta] of Object.entries(ALL_LOCATIONS)) {
    weatherMap[name] = {};
    const alt = meta.altitude || 'high';
    for (const key of dateKeys) {
      weatherMap[name][key] = seasonalDayForDate(key, alt);
    }
  }
  return weatherMap;
}

export function getOpenWeatherApiKey() {
  return (
    process.env.OPENWEATHER_API_KEY ||
    process.env.OPENWEATHERMAP_API_KEY ||
    process.env.OPEN_WEATHER_API_KEY ||
    ''
  ).trim();
}

/**
 * @param {string} startDateStr YYYY-MM-DD
 * @param {number} numDays days to include in map
 */
export async function fetchWeatherMapForDhams(startDateStr, numDays = 12) {
  const apiKey = getOpenWeatherApiKey();
  const alerts = [];
  const weatherMap = {};
  const dateKeys = dateKeysFromStart(startDateStr, numDays);
  let anyLive = false;

  const todayIst = toIstDateKey(Date.now() / 1000);
  const startMs = new Date(`${startDateStr}T12:00:00+05:30`).getTime();
  const todayMs = new Date(`${todayIst}T12:00:00+05:30`).getTime();
  const daysUntilStart = Math.ceil((startMs - todayMs) / 86400000);

  if (daysUntilStart > 5) {
    alerts.push(
      `Trip starts in ${daysUntilStart} days — live forecast covers ~5 days from today; later dates use seasonal norms for each location.`,
    );
  }

  if (!apiKey) {
    alerts.push(
      'OPENWEATHERMAP_API_KEY not set — using seasonal weather estimates.',
    );
    return {
      weatherMap: buildSeasonalWeatherMap(startDateStr, numDays),
      alerts,
    };
  }

  for (const [locationName, meta] of Object.entries(ALL_LOCATIONS)) {
    const altitude = meta.altitude || 'high';
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${meta.lat}&lon=${meta.lon}&appid=${apiKey}&units=metric&cnt=40`;
      const { data } = await axios.get(url, { timeout: 15000 });
      weatherMap[locationName] = aggregateForecastByDate(
        data.list,
        dateKeys,
        altitude,
      );
      if (
        Object.values(weatherMap[locationName]).some(
          (c) => c._source === 'openweather',
        )
      ) {
        anyLive = true;
      }
    } catch (e) {
      console.warn(
        `[weather] ${locationName}:`,
        e.response?.data?.message || e.message,
      );
      alerts.push(
        `Live weather unavailable for ${locationName} — using seasonal estimate.`,
      );
      weatherMap[locationName] = {};
      for (const key of dateKeys) {
        weatherMap[locationName][key] = seasonalDayForDate(key, altitude);
      }
    }
  }

  if (!anyLive) {
    alerts.push(
      'Could not reach OpenWeather for any location — check API key and network.',
    );
  }

  return { weatherMap, alerts };
}

/** Pick weather for a calendar day at a named location */
export function weatherForDay(weatherMap, locationName, dateStr, fallbackAltitude = 'high') {
  const cell = weatherMap[locationName]?.[dateStr];
  if (cell) {
    return {
      avgTempC: cell.avgTempC,
      condition: cell.condition,
      rainMm: cell.rainMm ?? 0,
      rainChance: cell.rainChance,
      windKmh: cell.windKmh,
      weatherCode: cell.weatherCode,
      _source: cell._source || 'seasonal',
    };
  }
  const alt =
    PLAINS_COORDS[locationName] ? 'plains' : fallbackAltitude;
  const s = seasonalDayForDate(dateStr, alt);
  return {
    avgTempC: s.avgTempC,
    condition: s.condition,
    rainMm: s.rainMm,
    rainChance: s.rainMm > 20 ? 50 : 20,
    windKmh: s.windKmh,
    weatherCode: weatherMainToCode(s.condition),
    _source: 'seasonal',
  };
}

export function seasonalWeatherForDate(dateStr, altitude = 'high') {
  const d = seasonalDayForDate(dateStr, altitude);
  return {
    avgTempC: d.avgTempC,
    condition: d.condition,
    rainMm: d.rainMm,
    windKmh: d.windKmh,
  };
}
