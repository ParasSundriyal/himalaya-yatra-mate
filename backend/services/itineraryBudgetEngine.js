/** Dynamic budget per planner spec */

const HOTEL_PER_NIGHT = {
  budget: 600,
  moderate: 1800,
  premium: 5000,
};

const FOOD_PER_PERSON_DAY = {
  budget: 300,
  moderate: 700,
  premium: 1500,
};

const ROAD_PER_KM = 12;
const HELI_SECTOR_MIN = 4500;
const HELI_SECTOR_MAX = 7000;

export function helicopterSectorCost(sectors = 1) {
  const mid = (HELI_SECTOR_MIN + HELI_SECTOR_MAX) / 2;
  return Math.round(mid * sectors);
}

/**
 * @param {{
 *   travelMode: string,
 *   budgetTier: string,
 *   groupSize: number,
 *   numberOfDays: number,
 *   totalKm: number,
 *   helicopterSectors?: number,
 * }} input
 */
export function calculateTripBudget(input) {
  const {
    travelMode = 'road',
    budgetTier = 'moderate',
    groupSize = 1,
    numberOfDays = 7,
    totalKm = 0,
    helicopterSectors = 0,
  } = input;

  const tier = ['budget', 'moderate', 'premium'].includes(budgetTier)
    ? budgetTier
    : 'moderate';
  const hotelNight = HOTEL_PER_NIGHT[tier];
  const foodDay = FOOD_PER_PERSON_DAY[tier];

  let transport = 0;
  if (travelMode === 'road' || travelMode === 'mixed') {
    transport += Math.round(totalKm * ROAD_PER_KM);
  }
  if (travelMode === 'helicopter' || travelMode === 'mixed') {
    const sectors = helicopterSectors || (travelMode === 'helicopter' ? 2 : 1);
    transport += helicopterSectorCost(sectors);
  }

  const accommodation = hotelNight * numberOfDays * groupSize;
  const food = foodDay * numberOfDays * groupSize;
  const total = transport + accommodation + food;

  return {
    currency: 'INR',
    total,
    perPerson: Math.round(total / Math.max(1, groupSize)),
    breakdown: {
      transport,
      accommodation,
      food,
      hotelPerNight: hotelNight,
      foodPerPersonDay: foodDay,
      totalKm: Math.round(totalKm),
      helicopterSectors: travelMode === 'trek' ? 0 : helicopterSectors,
    },
  };
}

export function dailyBudgetEstimate({
  travelMode,
  budgetTier,
  groupSize,
  dayKm = 0,
  isHeliDay = false,
}) {
  const tier = ['budget', 'moderate', 'premium'].includes(budgetTier)
    ? budgetTier
    : 'moderate';
  let transport = 0;
  if (travelMode === 'road' || travelMode === 'mixed') {
    transport = Math.round(dayKm * ROAD_PER_KM);
  }
  if (isHeliDay && (travelMode === 'helicopter' || travelMode === 'mixed')) {
    transport += helicopterSectorCost(1);
  }
  const hotel = HOTEL_PER_NIGHT[tier] * groupSize;
  const food = FOOD_PER_PERSON_DAY[tier] * groupSize;
  const total = transport + hotel + food;
  return {
    total,
    perPerson: Math.round(total / Math.max(1, groupSize)),
    transport,
    hotel,
    food,
  };
}
