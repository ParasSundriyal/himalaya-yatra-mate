import axios from 'axios';
import { DHAM_COORDS } from './weatherService.js';
import { displayNameForDham } from '../constants/dhamData.js';

const BASE = 'https://api.opentripmap.com/0.1/en';

const GEONAME_QUERY = {
  yamunotri: 'Yamunotri temple Uttarakhand',
  gangotri: 'Gangotri temple Uttarakhand',
  kedarnath: 'Kedarnath temple Uttarakhand',
  badrinath: 'Badrinath temple Uttarakhand',
};

const INTEREST_KINDS = {
  spiritual: ['religion', 'historic'],
  trekking: ['natural', 'mountains'],
  nature: ['natural', 'parks', 'forests'],
  photography: ['viewpoints', 'natural', 'architecture'],
  history: ['historic', 'archaeology'],
};

export function getOpenTripMapApiKey() {
  return (
    process.env.OPENTRIPMAP_API_KEY ||
    process.env.OPEN_TRIP_MAP_API_KEY ||
    ''
  ).trim();
}

export function interestsToKinds(interests = []) {
  const set = new Set(['religion', 'historic']);
  for (const i of interests || []) {
    const key = String(i).toLowerCase();
    for (const k of INTEREST_KINDS[key] || []) set.add(k);
  }
  return [...set].join(',');
}

function fallbackCoords(dhamKey) {
  const display = displayNameForDham(dhamKey);
  const c = DHAM_COORDS[display];
  if (!c) return null;
  return { lat: c.lat, lon: c.lon, name: display, _source: 'fallback' };
}

/** @returns {{ lat: number, lon: number, name: string, _source: string }} */
export async function geocodeDham(dhamKey) {
  const fb = fallbackCoords(dhamKey);
  const apiKey = getOpenTripMapApiKey();
  if (!apiKey) return fb;

  const name = GEONAME_QUERY[dhamKey] || displayNameForDham(dhamKey);
  try {
    const { data } = await axios.get(`${BASE}/places/geoname`, {
      params: { name, apikey: apiKey },
      timeout: 12000,
    });
    if (data?.lat != null && data?.lon != null) {
      return {
        lat: data.lat,
        lon: data.lon,
        name: data.name || displayNameForDham(dhamKey),
        _source: 'opentripmap',
      };
    }
  } catch (e) {
    console.warn(`[opentripmap] geoname ${dhamKey}:`, e.message);
  }
  return fb;
}

/**
 * @param {{ lat: number, lon: number, kinds: string, radius?: number, rate?: number, limit?: number }} opts
 */
export async function fetchPoisRadius(opts) {
  const apiKey = getOpenTripMapApiKey();
  const {
    lat,
    lon,
    kinds,
    radius = 30000,
    rate = 2,
    limit = 20,
  } = opts;

  if (!apiKey) return [];

  try {
    const { data } = await axios.get(`${BASE}/places/radius`, {
      params: {
        radius,
        lon,
        lat,
        kinds,
        rate,
        limit,
        apikey: apiKey,
      },
      timeout: 15000,
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[opentripmap] radius:', e.message);
    return [];
  }
}

export async function fetchPoiDetails(xid) {
  const apiKey = getOpenTripMapApiKey();
  if (!apiKey || !xid) return null;
  try {
    const { data } = await axios.get(`${BASE}/places/xid/${xid}`, {
      params: { apikey: apiKey },
      timeout: 12000,
    });
    return data;
  } catch (e) {
    console.warn(`[opentripmap] xid ${xid}:`, e.message);
    return null;
  }
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

export function distanceFromDhamKm(poi, dhamLat, dhamLon) {
  const plat = poi.point?.lat ?? poi.lat;
  const plon = poi.point?.lon ?? poi.lon;
  if (plat == null || plon == null) return null;
  return Math.round(haversineKm(dhamLat, dhamLon, plat, plon) * 10) / 10;
}

export function poiThumbnail(details) {
  if (!details) return null;
  const src = details.preview?.source;
  if (src) return src;
  const wiki = details.wikipedia;
  if (wiki) {
    const title = String(wiki).split(':').pop();
    return `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}?width=200`;
  }
  return null;
}

export function normalizePoiBrief(raw, details, dhamLat, dhamLon) {
  const name = details?.name || raw?.name || 'Point of interest';
  const kinds = details?.kinds || raw?.kinds || 'other';
  const category = String(kinds).split(',')[0] || 'place';
  const desc =
    (details?.wikipedia_extracts?.text || details?.info?.descr || '')
      .slice(0, 220) || `Explore ${name} near the dham.`;
  return {
    xid: raw?.xid || details?.xid,
    name,
    category,
    kinds,
    description: desc,
    image: poiThumbnail(details),
    distanceKm: distanceFromDhamKm(raw, dhamLat, dhamLon),
    rate: raw?.rate ?? details?.rate ?? 2,
    estimatedMinutes: 60,
  };
}

/** Top POIs with details for itinerary slots */
export async function loadDhamPois(dhamKey, interests, shuffleSeed = 0) {
  const coords = await geocodeDham(dhamKey);
  if (!coords) return { coords: null, pois: [], nearby: [] };

  const kinds = interestsToKinds(interests);
  const rawList = await fetchPoisRadius({
    lat: coords.lat,
    lon: coords.lon,
    kinds,
    radius: 30000,
    rate: 2,
    limit: 20,
  });

  let sorted = [...rawList].sort((a, b) => (b.rate || 0) - (a.rate || 0));
  if (shuffleSeed) {
    sorted = shuffleWithSeed(sorted, shuffleSeed);
  }

  const top = sorted.slice(0, 8);
  const pois = [];
  await Promise.all(
    top.map(async (raw) => {
      const details = await fetchPoiDetails(raw.xid);
      pois.push(normalizePoiBrief(raw, details, coords.lat, coords.lon));
    }),
  );

  const nearbyRaw = await fetchPoisRadius({
    lat: coords.lat,
    lon: coords.lon,
    kinds: 'religion,historic,natural,viewpoints',
    radius: 10000,
    rate: 3,
    limit: 12,
  });

  const nearby = [];
  for (const raw of nearbyRaw.slice(0, 8)) {
    const details = await fetchPoiDetails(raw.xid);
    nearby.push(normalizePoiBrief(raw, details, coords.lat, coords.lon));
  }

  return { coords, pois: pois.filter(Boolean), nearby };
}

function shuffleWithSeed(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
