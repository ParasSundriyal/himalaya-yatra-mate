import axios from 'axios';

export const DHAM_COORDS = {
  Yamunotri: { lat: 30.9993, lon: 78.4546 },
  Gangotri: { lat: 30.9946, lon: 78.9394 },
  Kedarnath: { lat: 30.7346, lon: 79.0669 },
  Badrinath: { lat: 30.7433, lon: 79.4938 },
};

const DEFAULT_DAY = {
  avgTempC: 10,
  condition: 'Clouds',
  rainMm: 0,
  windKmh: 15,
};

function dateKeyFromUnixUtc(sec) {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

/**
 * Aggregate OpenWeather 3-hour forecast list into per-calendar-day (UTC) stats.
 * @param {Array} list - API response list
 * @param {string} startDateStr - YYYY-MM-DD
 * @param {number} numDays - e.g. 10
 */
function aggregateForecastByDate(list, startDateStr, numDays = 10) {
  const start = new Date(`${startDateStr}T00:00:00.000Z`);
  const byDate = {};

  for (const item of list || []) {
    const key = dateKeyFromUnixUtc(item.dt);
    if (!byDate[key]) {
      byDate[key] = {
        temps: [],
        rains: [],
        firstItem: item,
      };
    }
    byDate[key].temps.push(item.main?.temp ?? 10);
    const r3 = item.rain?.['3h'] ?? item.rain?.['1h'] ?? 0;
    byDate[key].rains.push(typeof r3 === 'number' ? r3 : 0);
    if (!byDate[key].firstItem) {
      byDate[key].firstItem = item;
    }
  }

  const weatherMapForDham = {};
  for (let i = 0; i < numDays; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const agg = byDate[key];
    if (agg && agg.temps.length) {
      const avgTempC =
        agg.temps.reduce((a, b) => a + b, 0) / agg.temps.length;
      const rainMm = agg.rains.reduce((a, b) => a + b, 0);
      const first = agg.firstItem;
      const condition = first.weather?.[0]?.main ?? 'Clouds';
      const windMs = first.wind?.speed ?? 4;
      const windKmh = windMs * 3.6;
      weatherMapForDham[key] = {
        avgTempC: Math.round(avgTempC * 10) / 10,
        condition,
        rainMm: Math.round(rainMm * 10) / 10,
        windKmh: Math.round(windKmh * 10) / 10,
      };
    } else {
      weatherMapForDham[key] = { ...DEFAULT_DAY };
    }
  }
  return weatherMapForDham;
}

/**
 * @returns {Promise<{ weatherMap: Record<string, Record<string, object>>, alerts: string[] }>}
 */
export function getOpenWeatherApiKey() {
  return (
    process.env.OPENWEATHER_API_KEY ||
    process.env.OPENWEATHERMAP_API_KEY ||
    ''
  ).trim();
}

export async function fetchWeatherMapForDhams(startDateStr) {
  const apiKey = getOpenWeatherApiKey();
  const alerts = [];
  const weatherMap = {};

  for (const [dhamName, coords] of Object.entries(DHAM_COORDS)) {
    try {
      if (!apiKey) {
        throw new Error(
          'no API key: set OPENWEATHER_API_KEY or OPENWEATHERMAP_API_KEY in .env',
        );
      }
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&cnt=40`;
      const { data } = await axios.get(url, { timeout: 15000 });
      weatherMap[dhamName] = aggregateForecastByDate(
        data.list,
        startDateStr,
        12,
      );
    } catch (e) {
      alerts.push(
        `Live weather unavailable for ${dhamName}. Using typical seasonal data.`,
      );
      const fallback = {};
      const start = new Date(`${startDateStr}T00:00:00.000Z`);
      for (let i = 0; i < 12; i++) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        const key = d.toISOString().slice(0, 10);
        fallback[key] = { ...DEFAULT_DAY };
      }
      weatherMap[dhamName] = fallback;
    }
  }

  return { weatherMap, alerts };
}
