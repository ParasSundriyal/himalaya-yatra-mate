/**
 * Map free-text vehicle type to a coarse category for analytics / crowd models.
 * Never persist registration numbers in Firestore.
 * @param {string} [vehicleType]
 * @returns {'none' | 'two_wheeler' | 'car' | 'suv' | 'bus' | 'other'}
 */
export function vehicleCategoryFromType(vehicleType) {
  if (!vehicleType || !String(vehicleType).trim()) {
    return 'none';
  }
  const t = String(vehicleType).toLowerCase();

  if (/(bike|scooter|scooty|motorcycle|two\s*wheel|2\s*wheel)/i.test(t)) {
    return 'two_wheeler';
  }
  if (/(bus|tempo|traveller|coach)/i.test(t)) {
    return 'bus';
  }
  if (/(suv|jeep|muv|innova|fortuner|thar)/i.test(t)) {
    return 'suv';
  }
  if (/(car|sedan|hatchback|swift|dzire|wagon)/i.test(t)) {
    return 'car';
  }
  return 'other';
}

/**
 * @param {number} n
 * @returns {'1' | '2-5' | '6+'}
 */
export function groupSizeBand(n) {
  const s = Math.max(1, Math.min(50, Math.floor(Number(n) || 1)));
  if (s <= 1) return '1';
  if (s <= 5) return '2-5';
  return '6+';
}
