/**
 * Fetch and validate weather + crowd (+ ML) BEFORE the decision tree runs.
 */
import {
  addDaysStr,
  computeTotalDays,
  singleTripDays,
} from './decisionTree.js';
import { fetchWeatherMapForDhams, buildSeasonalWeatherMap } from './weatherService.js';
import { fetchCrowdMapForTrip } from './crowdService.js';

const KEY_TO_DISPLAY = {
  yamunotri: 'Yamunotri',
  gangotri: 'Gangotri',
  kedarnath: 'Kedarnath',
  badrinath: 'Badrinath',
};

export function estimateTripDayCount(bodyForTree) {
  const mode = bodyForTree.mode === 'single' ? 'single' : 'all4';
  const pace = bodyForTree.pace || 'moderate';
  const sideTrips = !!bodyForTree.sideTrips;
  if (mode === 'single') {
    const k = (bodyForTree.selectedDhams || ['kedarnath'])[0];
    return singleTripDays(k, pace);
  }
  return computeTotalDays(pace, sideTrips);
}

export function estimateTripDayDates(startDateStr, bodyForTree) {
  const n = estimateTripDayCount(bodyForTree);
  return Array.from({ length: n }, (_, i) => addDaysStr(startDateStr, i));
}

function isStaleDefaultWeather(day) {
  return (
    day &&
    day._source !== 'openweather' &&
    day.avgTempC === 10 &&
    day.condition === 'Clouds'
  );
}

function validateWeatherMap(weatherMap, dayDates) {
  const alerts = [];
  let liveCells = 0;
  let totalCells = 0;
  for (const dham of Object.keys(weatherMap)) {
    for (const d of dayDates) {
      totalCells += 1;
      const cell = weatherMap[dham]?.[d];
      if (cell?._source === 'openweather') liveCells += 1;
    }
  }
  if (totalCells > 0 && liveCells === 0) {
    alerts.push(
      'Live weather API unavailable — using seasonal estimates. Set OPENWEATHERMAP_API_KEY in backend .env and restart.',
    );
  } else if (liveCells > 0 && liveCells < totalCells * 0.3) {
    alerts.push('Weather forecast partially available — some days use seasonal estimates.');
  }
  return alerts;
}

function validateCrowdMap(crowdMap) {
  const alerts = [];
  const entries = Object.values(crowdMap);
  if (!entries.length) {
    alerts.push('Crowd data unavailable — using season and pass estimates.');
    return alerts;
  }
  const onlySeason = entries.every((c) => c?.source === 'season');
  if (onlySeason) {
    alerts.push(
      'Crowd ML service offline — using season + pass estimates. Run ML on port 5001 for live levels.',
    );
  }
  return alerts;
}

/**
 * @returns {Promise<{ weatherMap, crowdMap, alerts, dataQuality, dayDates }>}
 */
export async function buildItineraryInputData(startDateStr, bodyForTree) {
  const dayDates = estimateTripDayDates(startDateStr, bodyForTree);
  const numDays = dayDates.length;
  const selectedKeys = (bodyForTree.selectedDhams || []).map((d) =>
    String(d).toLowerCase(),
  );
  const dhamKeys =
    selectedKeys.length > 0
      ? selectedKeys
      : ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];

  const alerts = [];
  let weatherMap = {};

  try {
    const wRes = await fetchWeatherMapForDhams(startDateStr, numDays + 2);
    weatherMap = wRes.weatherMap;
    alerts.push(...(wRes.alerts || []));
  } catch (e) {
    console.warn('[itinerary] weather fetch failed:', e.message);
    alerts.push('Weather service error — using seasonal defaults.');
    weatherMap = buildSeasonalWeatherMap(startDateStr, numDays + 2);
  }

  let crowdMap = {};
  try {
    const cRes = await fetchCrowdMapForTrip({
      startDate: startDateStr,
      dayDates,
      dhamKeys,
      weatherMap,
    });
    crowdMap = cRes.crowdMap;
    alerts.push(...(cRes.alerts || []));
  } catch (e) {
    console.warn('[itinerary] crowd fetch failed:', e.message);
    alerts.push('Crowd service error — using season estimates.');
  }

  alerts.push(...validateWeatherMap(weatherMap, dayDates));
  alerts.push(...validateCrowdMap(crowdMap));

  const dataQuality = {
    weatherLiveRatio: countLiveWeatherRatio(weatherMap, dayDates),
    crowdSources: Object.fromEntries(
      Object.entries(crowdMap).map(([d, v]) => [d, v?.source || 'unknown']),
    ),
  };

  return {
    weatherMap,
    crowdMap,
    alerts: [...new Set(alerts.filter(Boolean))],
    dataQuality,
    dayDates,
    dhamDisplays: dhamKeys.map((k) => KEY_TO_DISPLAY[k]).filter(Boolean),
  };
}

function countLiveWeatherRatio(weatherMap, dayDates) {
  let live = 0;
  let total = 0;
  for (const dham of Object.keys(weatherMap)) {
    for (const d of dayDates) {
      total += 1;
      if (weatherMap[dham]?.[d]?._source === 'openweather') live += 1;
    }
  }
  return total ? live / total : 0;
}
