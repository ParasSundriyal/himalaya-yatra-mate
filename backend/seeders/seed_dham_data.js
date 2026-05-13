/**
 * Seed hotels (extended fields), dham parking lots, checkpoints, sample taxis.
 * Run: node seeders/seed_dham_data.js (from backend folder)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Hotel from '../models/Hotel.model.js';
import ParkingSlot from '../models/ParkingSlot.model.js';
import DhamCheckpoint from '../models/DhamCheckpoint.model.js';
import Taxi from '../models/Taxi.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/himalaya-yatra';

const LOC = {
  yamunotri: 'Yamunotri',
  gangotri: 'Gangotri',
  kedarnath: 'Kedarnath',
  badrinath: 'Badrinath',
};

const hotels = [
  {
    name: 'GMVN Janki Chatti',
    location: LOC.yamunotri,
    dham: 'yamunotri',
    type: 'dharamshala',
    pricePerNight: 800,
    distanceFromTemple: 6,
    isGMVN: true,
    locationName: 'Janki Chatti',
    coordinates: { lat: 30.992, lng: 78.45 },
    rating: 4.1,
    amenities: ['Hot water', 'Blankets', 'Langar'],
    totalRooms: 40,
    availableRooms: 28,
    contact: { phone: '9456781001', email: 'gmvn@uttarakhand.gov.in' },
  },
  {
    name: 'Yamuna Valley Lodge',
    location: LOC.yamunotri,
    dham: 'yamunotri',
    type: 'budget',
    pricePerNight: 1400,
    distanceFromTemple: 5.5,
    isGMVN: false,
    locationName: 'Barkot',
    coordinates: { lat: 30.81, lng: 78.21 },
    rating: 4.3,
    amenities: ['Parking', 'Restaurant', 'Wi‑Fi'],
    totalRooms: 22,
    availableRooms: 12,
    contact: { phone: '9410123002', email: 'stay@yamunavalley.in' },
  },
  {
    name: 'Gangotri Heights',
    location: LOC.gangotri,
    dham: 'gangotri',
    type: 'midrange',
    pricePerNight: 3200,
    distanceFromTemple: 0.4,
    isGMVN: false,
    locationName: 'Gangotri town',
    coordinates: { lat: 30.995, lng: 78.938 },
    rating: 4.5,
    amenities: ['Heater', 'Restaurant', 'Geyser'],
    totalRooms: 18,
    availableRooms: 9,
    contact: { phone: '9410123003', email: 'hello@gangotriheights.com' },
  },
  {
    name: 'GMVN Gangotri',
    location: LOC.gangotri,
    dham: 'gangotri',
    type: 'dharamshala',
    pricePerNight: 700,
    distanceFromTemple: 0.6,
    isGMVN: true,
    locationName: 'Gangotri',
    coordinates: { lat: 30.994, lng: 78.939 },
    rating: 4.0,
    amenities: ['Shared bath', 'Blankets'],
    totalRooms: 50,
    availableRooms: 22,
    contact: { phone: '9456781004', email: 'gmvn.gangotri@uttarakhand.gov.in' },
  },
  {
    name: 'Kedar Residency Guptkashi',
    location: LOC.kedarnath,
    dham: 'kedarnath',
    type: 'midrange',
    pricePerNight: 3800,
    distanceFromTemple: 32,
    isGMVN: false,
    locationName: 'Guptkashi',
    coordinates: { lat: 30.53, lng: 79.07 },
    rating: 4.4,
    amenities: ['Parking', 'Oxygen cylinder on request', 'Restaurant'],
    totalRooms: 30,
    availableRooms: 14,
    contact: { phone: '9410123005', email: 'stay@kedarnathresidency.in' },
  },
  {
    name: 'Sonprayag Riverside Camp',
    location: LOC.kedarnath,
    dham: 'kedarnath',
    type: 'budget',
    pricePerNight: 1200,
    distanceFromTemple: 22,
    isGMVN: false,
    locationName: 'Sonprayag',
    coordinates: { lat: 30.628, lng: 78.998 },
    rating: 3.9,
    amenities: ['Camps', 'Evening bonfire', 'Meals'],
    totalRooms: 60,
    availableRooms: 40,
    contact: { phone: '9410123006', email: 'camp@sonprayag.in' },
  },
  {
    name: 'Badrinath Sarovar Portico',
    location: LOC.badrinath,
    dham: 'badrinath',
    type: 'premium',
    pricePerNight: 7500,
    distanceFromTemple: 0.3,
    isGMVN: false,
    locationName: 'Badrinath town',
    coordinates: { lat: 30.743, lng: 79.494 },
    rating: 4.7,
    amenities: ['Heated rooms', 'Lift', 'Restaurant', 'Parking'],
    totalRooms: 35,
    availableRooms: 10,
    contact: { phone: '9410123007', email: 'badrinath@sarovar.in' },
  },
  {
    name: 'GMVN Badrinath',
    location: LOC.badrinath,
    dham: 'badrinath',
    type: 'dharamshala',
    pricePerNight: 900,
    distanceFromTemple: 0.5,
    isGMVN: true,
    locationName: 'Badrinath',
    coordinates: { lat: 30.744, lng: 79.493 },
    rating: 4.2,
    amenities: ['Langar', 'Locker'],
    totalRooms: 80,
    availableRooms: 35,
    contact: { phone: '9456781008', email: 'gmvn.badrinath@uttarakhand.gov.in' },
  },
];

function parkingDoc(dham, name, checkpoint, dist, coords, slots, price) {
  return {
    dham,
    locationName: name,
    checkpointName: checkpoint,
    distanceFromTemple: dist,
    coordinates: coords,
    slotTypes: slots,
    pricePerDay: price,
    facilities: ['CCTV', 'Toilet', 'Security', 'Drinking water'],
    openingTime: '05:00',
    closingTime: '21:00',
    isActive: true,
  };
}

const parkingLots = [
  parkingDoc(
    'yamunotri',
    'Janki Chatti Main Parking',
    'Yamunotri check-post',
    6,
    { lat: 30.9915, lng: 78.451 },
    {
      bike: { total: 120, available: 80 },
      car: { total: 60, available: 35 },
      suv: { total: 40, available: 22 },
      bus: { total: 12, available: 4 },
    },
    200,
  ),
  parkingDoc(
    'gangotri',
    'Gangotri Bus Stand Parking',
    'Gangotri entry',
    0.8,
    { lat: 30.9938, lng: 78.941 },
    {
      bike: { total: 200, available: 140 },
      car: { total: 180, available: 95 },
      suv: { total: 70, available: 40 },
      bus: { total: 20, available: 8 },
    },
    250,
  ),
  parkingDoc(
    'kedarnath',
    'Sonprayag Multi-level Parking',
    'Sonprayag (last motorable point)',
    22,
    { lat: 30.627, lng: 78.997 },
    {
      bike: { total: 400, available: 220 },
      car: { total: 800, available: 410 },
      suv: { total: 300, available: 140 },
      bus: { total: 60, available: 18 },
    },
    350,
  ),
  parkingDoc(
    'badrinath',
    'Badrinath Temple Road Parking',
    'Near bus stand',
    0.6,
    { lat: 30.7425, lng: 79.492 },
    {
      bike: { total: 150, available: 90 },
      car: { total: 220, available: 120 },
      suv: { total: 100, available: 55 },
      bus: { total: 25, available: 10 },
    },
    300,
  ),
];

const checkpoints = [
  {
    dham: 'yamunotri',
    name: 'Janki Chatti Registration',
    type: 'registration',
    distanceFromTemple: 6,
    description: 'Biometric registration and pass verification.',
    coordinates: { lat: 30.9918, lng: 78.4505 },
  },
  {
    dham: 'yamunotri',
    name: 'Hanuman Chatti Entry',
    type: 'entry',
    distanceFromTemple: 19,
    description: 'Vehicle checkpoint before Janki Chatti approach.',
    coordinates: { lat: 30.51, lng: 78.44 },
  },
  {
    dham: 'gangotri',
    name: 'Gangotri Forest Check',
    type: 'entry',
    distanceFromTemple: 25,
    description: 'Forest department entry for Gangotri road.',
    coordinates: { lat: 30.85, lng: 78.65 },
  },
  {
    dham: 'gangotri',
    name: 'Gangotri Temple Gate',
    type: 'entry',
    distanceFromTemple: 0.1,
    description: 'QR scan for Dham Pass pilgrims.',
    coordinates: { lat: 30.9952, lng: 78.9388 },
  },
  {
    dham: 'kedarnath',
    name: 'Sonprayag Vehicle Barrier',
    type: 'entry',
    distanceFromTemple: 22,
    description: 'Mandatory parking; shared jeeps to Gaurikund.',
    coordinates: { lat: 30.6272, lng: 78.9971 },
  },
  {
    dham: 'kedarnath',
    name: 'Phata Helipad',
    type: 'helipad',
    distanceFromTemple: 18,
    description: 'Helicopter shuttle to Kedarnath (weather dependent).',
    coordinates: { lat: 30.55, lng: 79.12 },
  },
  {
    dham: 'badrinath',
    name: 'Joshimath Checkpoint',
    type: 'entry',
    distanceFromTemple: 45,
    description: 'Road safety and pass checks on Rishikesh–Badrinath highway.',
    coordinates: { lat: 30.555, lng: 79.565 },
  },
  {
    dham: 'badrinath',
    name: 'Badrinath Temple Entry',
    type: 'entry',
    distanceFromTemple: 0.05,
    description: 'Dham Pass QR mandatory; medical aid nearby.',
    coordinates: { lat: 30.7433, lng: 79.4938 },
  },
];

const taxis = [
  {
    driverName: 'Ramesh Rawat',
    driverPhone: '9876501111',
    vehicleType: 'Innova',
    vehicleNumber: 'UK08X1001',
    seats: 7,
    ratePerKm: 18,
    rating: 4.6,
    location: LOC.yamunotri,
    coordinates: { lat: 30.81, lng: 78.21 },
    licenseNumber: 'UK-LCV-1001',
  },
  {
    driverName: 'Suresh Bhatt',
    driverPhone: '9876502222',
    vehicleType: 'Bolero',
    vehicleNumber: 'UK08Y2002',
    seats: 8,
    ratePerKm: 16,
    rating: 4.4,
    location: LOC.gangotri,
    coordinates: { lat: 30.73, lng: 78.45 },
    licenseNumber: 'UK-LCV-2002',
  },
  {
    driverName: 'Vijay Semwal',
    driverPhone: '9876503333',
    vehicleType: 'Tempo Traveller',
    vehicleNumber: 'UK08Z3003',
    seats: 12,
    ratePerKm: 22,
    rating: 4.8,
    location: LOC.kedarnath,
    coordinates: { lat: 30.53, lng: 79.07 },
    licenseNumber: 'UK-LCV-3003',
  },
  {
    driverName: 'Ajay Negi',
    driverPhone: '9876504444',
    vehicleType: 'Innova Crysta',
    vehicleNumber: 'UK08A4004',
    seats: 7,
    ratePerKm: 20,
    rating: 4.7,
    location: LOC.badrinath,
    coordinates: { lat: 30.55, lng: 79.55 },
    licenseNumber: 'UK-LCV-4004',
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Seeding dham itinerary data...');

  await Hotel.deleteMany({ name: { $in: hotels.map((h) => h.name) } });
  await ParkingSlot.deleteMany({});
  await DhamCheckpoint.deleteMany({});
  await Taxi.deleteMany({ driverPhone: { $in: taxis.map((t) => t.driverPhone) } });

  await Hotel.insertMany(hotels.map((h) => ({ ...h, isActive: true, description: h.name })));
  await ParkingSlot.insertMany(parkingLots);
  await DhamCheckpoint.insertMany(checkpoints.map((c) => ({ ...c, isOperational: true })));
  await Taxi.insertMany(
    taxis.map((t) => ({ ...t, isAvailable: true, isActive: true, totalRides: 0 })),
  );

  console.log(
    `Inserted ${hotels.length} hotels, ${parkingLots.length} parking lots, ${checkpoints.length} checkpoints, ${taxis.length} taxis.`,
  );
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
