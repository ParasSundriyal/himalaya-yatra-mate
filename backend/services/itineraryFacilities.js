import Hotel from '../models/Hotel.model.js';
import ParkingSlot from '../models/ParkingSlot.model.js';
import DhamCheckpoint from '../models/DhamCheckpoint.model.js';
import Taxi from '../models/Taxi.model.js';
import { displayNameForDham } from '../constants/dhamData.js';

const accommodationTypeMap = {
  budget: ['dharamshala', 'budget'],
  midrange: ['midrange'],
  premium: ['premium', 'midrange'],
};

const budgetPerNightCap = {
  budget: 1500,
  midrange: 4000,
  premium: 999999,
};

function serializeHotel(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(o._id),
    name: o.name,
    type: o.type || 'midrange',
    pricePerNight: o.pricePerNight,
    distanceFromTemple: o.distanceFromTemple ?? 1,
    amenities: o.amenities || [],
    rating: o.rating ?? 0,
    contactPhone: o.contact?.phone || '',
    isGMVN: !!o.isGMVN,
    coordinates: o.coordinates,
    locationName: o.locationName || o.location,
  };
}

function serializeParking(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(o._id),
    locationName: o.locationName,
    checkpointName: o.checkpointName || '',
    distanceFromTemple: o.distanceFromTemple ?? 0,
    slotTypes: o.slotTypes || {},
    pricePerDay: o.pricePerDay,
    facilities: o.facilities || [],
    coordinates: o.coordinates,
    openingTime: o.openingTime,
    closingTime: o.closingTime,
  };
}

function serializeCheckpoint(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(o._id),
    name: o.name,
    type: o.type || 'entry',
    distanceFromTemple: o.distanceFromTemple ?? 0,
    description: o.description || '',
    coordinates: o.coordinates,
  };
}

function serializeTaxi(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: String(o._id),
    driverName: o.driverName,
    driverPhone: o.driverPhone,
    vehicleType: o.vehicleType,
    vehicleNumber: o.vehicleNumber,
    seats: o.seats,
    ratePerKm: o.ratePerKm,
    rating: o.rating ?? 0,
    location: o.location,
    coordinates: o.coordinates,
  };
}

/**
 * @param {string[]} dhamKeys lowercase
 * @param {string} accommodation budget|midrange|premium
 * @param {string} vehicleType none|bike|car|suv|bus
 */
export async function buildFacilitiesPerDham(dhamKeys, accommodation, vehicleType) {
  const acc = accommodation || 'midrange';
  const types = accommodationTypeMap[acc] || accommodationTypeMap.midrange;
  const cap = budgetPerNightCap[acc] ?? 4000;
  const vt = (vehicleType || 'none').toLowerCase();
  const out = {};

  await Promise.all(
    dhamKeys.map(async (dhamKey) => {
      const display = displayNameForDham(dhamKey);
      const [hotels, parking, checkpoints, taxis] = await Promise.all([
        Hotel.find({
          $or: [{ dham: dhamKey }, { location: display }],
          type: { $in: types },
          pricePerNight: { $lte: cap },
          isActive: true,
        })
          .sort({ rating: -1 })
          .limit(5)
          .lean(),
        vt === 'none'
          ? Promise.resolve([])
          : ParkingSlot.find({
              dham: dhamKey,
              [`slotTypes.${vt}.available`]: { $gt: 0 },
              isActive: true,
            })
              .sort({ distanceFromTemple: 1 })
              .limit(8)
              .lean(),
        DhamCheckpoint.find({ dham: dhamKey, isOperational: true })
          .sort({ distanceFromTemple: 1 })
          .limit(12)
          .lean(),
        Taxi.find({
          location: display,
          isActive: true,
          isAvailable: true,
        })
          .sort({ rating: -1 })
          .limit(5)
          .lean(),
      ]);

      const crowdLevel = null;
      out[dhamKey] = {
        hotels: hotels.map(serializeHotel),
        parking: parking.map(serializeParking),
        checkpoints: checkpoints.map(serializeCheckpoint),
        taxis: taxis.map(serializeTaxi),
        crowdLevel,
      };
    }),
  );

  return out;
}

export function attachCrowdLevels(facilitiesPerDham, crowdMap) {
  const norm = (l) => {
    if (!l) return 'Medium';
    const s = String(l);
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };
  const keyToDisplay = {
    yamunotri: 'Yamunotri',
    gangotri: 'Gangotri',
    kedarnath: 'Kedarnath',
    badrinath: 'Badrinath',
  };
  for (const k of Object.keys(facilitiesPerDham || {})) {
    const disp = keyToDisplay[k] || k;
    const lv = crowdMap?.[disp]?.level || crowdMap?.[k]?.level;
    facilitiesPerDham[k].crowdLevel = norm(lv);
  }
  return facilitiesPerDham;
}
