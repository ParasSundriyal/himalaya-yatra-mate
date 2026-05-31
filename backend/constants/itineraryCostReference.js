/**
 * Per-person day costs (INR) for Char Dham planning — indicative, not quotes.
 * Based on typical 2025–26 yatra spend: dharamshala/budget stays, local meals,
 * shared jeeps (excludes Delhi↔Haridwar flights and private hire unless noted.
 *
 * Use with estimateDayCost() in decisionTree.
 */

/** @typedef {'budget'|'midrange'|'premium'} AccTier */
/** @typedef {'arrival_lite'|'road_transfer'|'base_night'|'dham_visit'|'kedarnath_trek'|'kedarnath_heli_base'|'side_trip'|'buffer'|'return'} DayCostType */

/** Per-person INR by tier and day type */
export const DAY_COST_INR = {
  budget: {
    arrival_lite: 1600, // Haridwar/Rishikesh night + meals; Ganga aarti free
    road_transfer: 1800, // travel day + simple stay
    base_night: 2000, // Guptkashi, Barkot, Joshimath halt
    dham_visit: 2400, // temple day + stay + meals
    kedarnath_trek: 2800, // trek day (pony extra in tree if selected)
    kedarnath_heli_base: 2200, // night + meals at helipad town
    side_trip: 1400,
    buffer: 1700,
    return: 1200,
  },
  midrange: {
    arrival_lite: 2400,
    road_transfer: 3200,
    base_night: 3600,
    dham_visit: 4200,
    kedarnath_trek: 4800,
    kedarnath_heli_base: 3800,
    side_trip: 2600,
    buffer: 3000,
    return: 2000,
  },
  premium: {
    arrival_lite: 4500,
    road_transfer: 5500,
    base_night: 6500,
    dham_visit: 7500,
    kedarnath_trek: 8500,
    kedarnath_heli_base: 7000,
    side_trip: 4000,
    buffer: 5000,
    return: 3500,
  },
};

/** One-way Kedarnath helicopter (per person), 2025–26 typical */
export const KEDARNATH_HELI_ONE_WAY_INR = 6500;

/** Pony/palki Gaurikund–Kedarnath approximate */
export const KEDARNATH_PONY_ONE_WAY_INR = 3200;

/**
 * @param {DayCostType} dayType
 * @param {AccTier} tier
 * @param {{ helicopterSurcharge?: boolean, ponySurcharge?: boolean }} extras
 */
export function estimateDayCost(dayType, tier = 'midrange', extras = {}) {
  const t = DAY_COST_INR[tier] ? tier : 'midrange';
  let cost = DAY_COST_INR[t][dayType] ?? DAY_COST_INR[t].dham_visit;
  if (extras.helicopterSurcharge) cost += KEDARNATH_HELI_ONE_WAY_INR;
  if (extras.ponySurcharge) cost += KEDARNATH_PONY_ONE_WAY_INR;
  return Math.round(cost);
}
