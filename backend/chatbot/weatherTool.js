import axios from 'axios';
import {
  DHAM_COORDS,
  getOpenWeatherApiKey,
  toIstDateKey,
  seasonalWeatherForDate,
} from '../services/weatherService.js';

function normalizeDhamKey(name = '') {
  const k = String(name).toLowerCase();
  const map = {
    yamunotri: 'Yamunotri',
    gangotri: 'Gangotri',
    kedarnath: 'Kedarnath',
    badrinath: 'Badrinath',
  };
  return map[k] || 'Kedarnath';
}

function conditionFromCode(main, description) {
  if (description) return description.charAt(0).toUpperCase() + description.slice(1);
  return main || 'Unknown';
}

/**
 * Live current weather for a Dham (OpenWeather current API).
 */
export async function fetchCurrentWeatherForDham(dhamName) {
  if (!dhamName) {
    return { error: 'Dham name required for weather lookup.' };
  }
  const location = normalizeDhamKey(dhamName);
  const coords = DHAM_COORDS[location];
  if (!coords) {
    return { error: `Unknown location: ${dhamName}` };
  }

  const apiKey = getOpenWeatherApiKey();
  const today = toIstDateKey(Date.now() / 1000);

  if (!apiKey) {
    const est = seasonalWeatherForDate(today, 'high');
    return {
      success: true,
      location,
      temperature: `${est.avgTempC}°C`,
      condition: est.condition,
      wind: `${est.windKmh} km/h`,
      humidity: 'N/A',
      rainChance: est.rainMm > 25 ? 'High' : est.rainMm > 10 ? 'Medium' : 'Low',
      clouds: est.condition === 'Clouds' ? 'Overcast' : 'Clear',
      source: 'seasonal_estimate',
    };
  }

  try {
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat: coords.lat, lon: coords.lon, appid: apiKey, units: 'metric' },
      timeout: 8000,
    });

    const main = data.weather?.[0]?.main;
    const desc = data.weather?.[0]?.description;
    const cloudsPct = data.clouds?.all ?? 0;
    const hasRain = Boolean(data.rain);

    return {
      success: true,
      location,
      temperature: data.main?.temp != null ? `${Math.round(data.main.temp)}°C` : 'N/A',
      condition: conditionFromCode(main, desc),
      wind:
        data.wind?.speed != null
          ? `${Math.round(data.wind.speed * 3.6)} km/h`
          : 'N/A',
      humidity: data.main?.humidity != null ? `${data.main.humidity}%` : 'N/A',
      rainChance: hasRain ? 'Rain now' : cloudsPct > 70 ? 'Possible' : 'Low',
      clouds: `${cloudsPct}% cloud cover`,
      source: 'openweather_live',
    };
  } catch (err) {
    const est = seasonalWeatherForDate(today, 'high');
    return {
      success: true,
      location,
      temperature: `${est.avgTempC}°C`,
      condition: est.condition,
      wind: `${est.windKmh} km/h`,
      humidity: 'N/A',
      rainChance: est.rainMm > 20 ? 'Medium' : 'Low',
      clouds: est.condition === 'Clouds' ? 'Overcast' : 'Clear',
      source: 'seasonal_fallback',
      warning: err.message,
    };
  }
}
