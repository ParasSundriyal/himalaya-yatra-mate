import ngeohash from 'ngeohash';

/** Rough bounding box for India + Himalayan yatra region (reject obvious spoofing). */
const LAT_MIN = 6;
const LAT_MAX = 37;
const LNG_MIN = 68;
const LNG_MAX = 98;

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
export function isPlausibleIndiaRegion(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= LAT_MIN &&
    lat <= LAT_MAX &&
    lng >= LNG_MIN &&
    lng <= LNG_MAX
  );
}

/**
 * Encode to geohash only — no raw coordinates should be written to Firestore.
 * Precision 5 ≈ ~5 km; good for regional crowd signals without pinpointing users.
 * @param {number} lat
 * @param {number} lng
 * @param {number} [precision=5]
 */
export function toGeohash(lat, lng, precision = 5) {
  return ngeohash.encode(lat, lng, precision);
}
