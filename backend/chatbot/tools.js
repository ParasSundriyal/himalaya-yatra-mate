import axios from 'axios';
import Parking from '../models/Parking.model.js';
import Hotel from '../models/Hotel.model.js';
import Taxi from '../models/Taxi.model.js';
import Booking from '../models/Booking.model.js';
import Checkpoint from '../models/Checkpoint.model.js';
import HourlyPassSlot from '../models/HourlyPassSlot.model.js';
import CheckpointPass from '../models/CheckpointPass.model.js';
import User from '../models/User.model.js';
import { getFirestoreDb } from '../services/firebaseAdmin.js';
import { DHAM_INFO, DHAM_KEYS } from '../constants/dhamData.js';
import { runWebSearch } from './webSearchService.js';
import { fetchCurrentWeatherForDham } from './weatherTool.js';
import QRCode from 'qrcode';

const BACKEND_BASE =
  process.env.BACKEND_BASE_URL ||
  `http://127.0.0.1:${process.env.PORT || 5000}`;
const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ─── Tool Definitions (OpenAI function-calling format) ──────────────────────

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_parking_areas',
      description: 'Get all parking areas with slot availability. Use when user asks about parking.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_parking_slots',
      description: 'Get available slots for a specific parking area by ID. Use after get_parking_areas to drill down.',
      parameters: {
        type: 'object',
        properties: { areaId: { type: 'string', description: 'Parking area ID from get_parking_areas' } },
        required: ['areaId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_hotels',
      description: 'Get available hotels. Optional filters: location, minPrice, maxPrice, rating. Use when user asks about hotels or accommodation.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'Filter by location e.g. kedarnath, badrinath' },
          minPrice: { type: 'number', description: 'Minimum price per night' },
          maxPrice: { type: 'number', description: 'Maximum price per night' },
          rating: { type: 'number', description: 'Minimum rating (0-5)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_taxis',
      description: 'Get available taxis. Optional filters: location, vehicleType, minSeats, maxPrice. Use when user asks about taxis or cab.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'Filter by location' },
          vehicleType: { type: 'string', description: 'e.g. SUV, sedan' },
          minSeats: { type: 'integer', description: 'Minimum seats needed' },
          maxPrice: { type: 'number', description: 'Max rate per km' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_checkpoints',
      description: 'Get all active checkpoints where hourly passes can be booked. Use when user asks about hourly passes or checkpoints.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_hourly_pass_slots',
      description: 'Get available hourly pass time slots for a checkpoint on a date. Use after get_checkpoints.',
      parameters: {
        type: 'object',
        properties: {
          checkpointId: { type: 'string', description: 'Checkpoint ID from get_checkpoints' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' },
        },
        required: ['checkpointId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_crowd_live',
      description: 'Get live crowd data for all four Dhams or a specific one. Use when user asks about crowd or how busy a Dham is.',
      parameters: {
        type: 'object',
        properties: {
          dhamName: { type: 'string', description: 'Optional: yamunotri, gangotri, kedarnath, or badrinath' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_crowd_predict',
      description: 'Predict crowd level for a Dham on a future date.',
      parameters: {
        type: 'object',
        properties: {
          dham: { type: 'string', description: 'One of: yamunotri, gangotri, kedarnath, badrinath' },
          date: { type: 'string', description: 'YYYY-MM-DD format' },
        },
        required: ['dham', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_live',
      description: 'Get live dashboard data for all Dhams: crowd level, temperature, passes issued, wait time, road status. Best tool for crowd + weather questions.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get live weather for a Dham: temperature, condition, clouds, humidity, wind, rain chance. Use for weather or mausam questions.',
      parameters: {
        type: 'object',
        properties: {
          dhamName: { type: 'string', description: 'yamunotri, gangotri, kedarnath, or badrinath' },
        },
        required: ['dhamName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dham_status',
      description: 'Get opening/closing status of all four Dhams including dates and days until opening.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_nearby_attractions',
      description: 'Get nearby attractions around a specific Dham.',
      parameters: {
        type: 'object',
        properties: { dhamName: { type: 'string', description: 'e.g. kedarnath, badrinath' } },
        required: ['dhamName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for general questions about Chardham, travel tips, history, culture, packing lists, or anything not covered by other tools.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_parking_bookings',
      description: 'Get the logged-in user\'s parking bookings. Use when user asks "show my parking bookings".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_parking',
      description: 'Book a parking slot. Requires areaId, slotId, vehicleNumber. ALWAYS confirm details with user before calling.',
      parameters: {
        type: 'object',
        properties: {
          areaId: { type: 'string', description: 'Parking area ID' },
          slotId: { type: 'string', description: 'Specific slot ID' },
          vehicleNumber: { type: 'string', description: 'e.g. UK07AB1234' },
        },
        required: ['areaId', 'slotId', 'vehicleNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_hotel_bookings',
      description: 'Get the logged-in user\'s hotel bookings.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_hotel',
      description: 'Book a hotel room. Requires hotelId, checkIn, checkOut, guests, rooms. ALWAYS confirm with user before booking.',
      parameters: {
        type: 'object',
        properties: {
          hotelId: { type: 'string', description: 'Hotel ID from get_hotels' },
          checkIn: { type: 'string', description: 'ISO date e.g. 2026-06-01' },
          checkOut: { type: 'string', description: 'ISO date e.g. 2026-06-03' },
          guests: { type: 'integer', description: 'Number of guests, min 1' },
          rooms: { type: 'integer', description: 'Number of rooms, min 1' },
        },
        required: ['hotelId', 'checkIn', 'checkOut', 'guests', 'rooms'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_taxi_bookings',
      description: 'Get the logged-in user\'s taxi bookings.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_taxi',
      description: 'Book a taxi. Requires taxiId, pickupLocation, dropoffLocation, pickupTime, distance. ALWAYS confirm with user before booking.',
      parameters: {
        type: 'object',
        properties: {
          taxiId: { type: 'string', description: 'Taxi ID from get_taxis' },
          pickupLocation: { type: 'string', description: 'e.g. Rishikesh' },
          dropoffLocation: { type: 'string', description: 'e.g. Kedarnath' },
          pickupTime: { type: 'string', description: 'ISO datetime e.g. 2026-06-01T08:00:00Z' },
          distance: { type: 'number', description: 'Distance in km' },
        },
        required: ['taxiId', 'pickupLocation', 'dropoffLocation', 'pickupTime', 'distance'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_hourly_passes',
      description: 'Get the logged-in user\'s hourly checkpoint passes.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_hourly_pass',
      description: 'Book an hourly checkpoint pass. ALWAYS confirm with user before booking.',
      parameters: {
        type: 'object',
        properties: {
          checkpointId: { type: 'string', description: 'Checkpoint ID' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          hour: { type: 'integer', description: '0-23 integer' },
          vehicleOwnerName: { type: 'string', description: 'Owner full name' },
          vehicleOwnerPhone: { type: 'string', description: 'Phone number' },
          vehicleNumber: { type: 'string', description: 'e.g. UK07AB1234' },
          numberOfPeople: { type: 'integer', description: 'Default 1' },
        },
        required: ['checkpointId', 'date', 'hour', 'vehicleOwnerName', 'vehicleOwnerPhone', 'vehicleNumber'],
      },
    },
  },
];

// ─── Tool Execution (Direct DB / Internal calls — Option A) ─────────────────

const DHAMS = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];
const YEARLY_OPENING_DATES_IMPORT = async () => {
  const mod = await import('../constants/dhamData.js');
  return mod.YEARLY_OPENING_DATES;
};

/**
 * Execute a tool by name with given arguments.
 * @param {string} name - Tool function name
 * @param {Object} args - Parsed arguments from LLM
 * @param {Object} context - { userId, userToken }
 * @returns {Promise<Object>} Tool result
 */
export async function executeTool(name, args, context = {}) {
  try {
    switch (name) {
      case 'get_parking_areas':
        return await execGetParkingAreas();
      case 'get_parking_slots':
        return await execGetParkingSlots(args);
      case 'get_hotels':
        return await execGetHotels(args);
      case 'get_taxis':
        return await execGetTaxis(args);
      case 'get_checkpoints':
        return await execGetCheckpoints();
      case 'get_hourly_pass_slots':
        return await execGetHourlyPassSlots(args);
      case 'get_crowd_live':
        return await execGetCrowdLive(args);
      case 'get_crowd_predict':
        return await execGetCrowdPredict(args);
      case 'get_dashboard_live':
        return await execGetDashboardLive();
      case 'get_weather':
        return await fetchCurrentWeatherForDham(args.dhamName || args.dham);
      case 'get_dham_status':
        return await execGetDhamStatus();
      case 'get_nearby_attractions':
        return await execGetNearbyAttractions(args);
      case 'web_search':
        return await execWebSearch(args);
      case 'get_my_parking_bookings':
        return await execGetMyBookings(context, 'parking');
      case 'book_parking':
        return await execBookParking(args, context);
      case 'get_my_hotel_bookings':
        return await execGetMyBookings(context, 'hotel');
      case 'book_hotel':
        return await execBookHotel(args, context);
      case 'get_my_taxi_bookings':
        return await execGetMyBookings(context, 'taxi');
      case 'book_taxi':
        return await execBookTaxi(args, context);
      case 'get_my_hourly_passes':
        return await execGetMyHourlyPasses(context);
      case 'book_hourly_pass':
        return await execBookHourlyPass(args, context);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    console.error(`[Tool:${name}] Error:`, err.message);
    return { error: err.message };
  }
}

// ─── Individual Tool Implementations ────────────────────────────────────────

async function execGetParkingAreas() {
  const areas = await Parking.find({}).select('name location coordinates totalSlots availableSlots');
  return { success: true, count: areas.length, areas };
}

async function execGetParkingSlots({ areaId }) {
  const parking = await Parking.findById(areaId);
  if (!parking) return { error: 'Parking area not found' };
  const slots = parking.slots.map(s => ({
    id: s._id, slotNumber: s.slotNumber, status: s.status,
    size: s.size, pricePerDay: s.pricePerDay,
  }));
  return { success: true, area: { id: parking._id, name: parking.name, location: parking.location }, slots };
}

async function execGetHotels({ location, minPrice, maxPrice, rating } = {}) {
  const filter = { isActive: true };
  if (location) {
    const loc = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();
    filter.location = loc;
  }
  if (minPrice) filter.pricePerNight = { ...filter.pricePerNight, $gte: minPrice };
  if (maxPrice) filter.pricePerNight = { ...filter.pricePerNight, $lte: maxPrice };
  if (rating) filter.rating = { $gte: rating };
  const hotels = await Hotel.find(filter).select('name location pricePerNight rating amenities totalRooms availableRooms description');
  return { success: true, count: hotels.length, hotels };
}

async function execGetTaxis({ location, vehicleType, minSeats, maxPrice } = {}) {
  const filter = { isActive: true, isAvailable: true };
  if (location) {
    const loc = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();
    filter.location = loc;
  }
  if (vehicleType) filter.vehicleType = new RegExp(vehicleType, 'i');
  if (minSeats) filter.seats = { $gte: minSeats };
  if (maxPrice) filter.ratePerKm = { $lte: maxPrice };
  const taxis = await Taxi.find(filter).select('driverName vehicleType vehicleNumber seats ratePerKm rating location');
  return { success: true, count: taxis.length, taxis };
}

async function execGetCheckpoints() {
  const checkpoints = await Checkpoint.find({ isActive: true }).select('name location description maxPassesPerSlot pricePerHour operatingHours');
  return { success: true, count: checkpoints.length, checkpoints };
}

async function execGetHourlyPassSlots({ checkpointId, date }) {
  const dateStr = date || new Date().toISOString().slice(0, 10);
  const slots = await HourlyPassSlot.find({ checkpoint: checkpointId, date: dateStr, isActive: true })
    .sort({ hour: 1 });
  // Also count booked passes per slot
  const result = [];
  for (const slot of slots) {
    const booked = await CheckpointPass.countDocuments({
      checkpoint: checkpointId,
      'timeSlot.start': { $gte: new Date(`${dateStr}T${String(slot.hour).padStart(2, '0')}:00:00`) },
      'timeSlot.end': { $lte: new Date(`${dateStr}T${String(slot.hour + 1).padStart(2, '0')}:00:00`) },
      status: { $in: ['confirmed', 'pending'] },
    });
    result.push({
      hour: slot.hour, capacity: slot.capacity, booked, available: slot.capacity - booked,
      price: slot.price,
    });
  }
  return { success: true, date: dateStr, checkpointId, slots: result };
}

async function execGetCrowdLive({ dhamName } = {}) {
  const db = getFirestoreDb();
  if (!db) return { error: 'Firestore unavailable' };
  if (dhamName) {
    const id = String(dhamName).toLowerCase();
    const snap = await db.collection('crowd_data').doc(id).get();
    return snap.exists ? snap.data() : { error: 'Dham not found' };
  }
  const snaps = await Promise.all(DHAMS.map(d => db.collection('crowd_data').doc(d).get()));
  const out = {};
  snaps.forEach((snap, i) => { out[DHAMS[i]] = snap.exists ? snap.data() : null; });
  return out;
}

async function execGetCrowdPredict({ dham, date }) {
  try {
    const { data } = await axios.post(`${ML_BASE}/predict`, { dham, date, weather_code: 0, pass_quota_pct: 0.5 }, { timeout: 5000 });
    return data;
  } catch {
    return { level: 'Medium', confidence: 0.5, message: 'ML service unavailable — estimate only' };
  }
}

async function execGetDashboardLive() {
  try {
    const { data } = await axios.get(`${BACKEND_BASE}/api/dashboard/live`, { timeout: 10000 });
    return data;
  } catch (e) {
    const db = getFirestoreDb();
    if (!db) {
      return { error: 'Dashboard unavailable: ' + e.message };
    }
    try {
      const snaps = await Promise.all(
        DHAMS.map((dham) => db.collection('crowd_data').doc(dham).get()),
      );
      const cards = snaps.map((snap, i) => {
        const dham = DHAMS[i];
        const doc = snap.exists ? snap.data() : {};
        return {
          dham,
          crowd: {
            level: doc?.finalLevel || doc?.level || 'Medium',
            pct: typeof doc?.crowdPct === 'number' ? Math.round(doc.crowdPct) : null,
          },
          waitTimeMins: doc?.waitTimeMin ?? null,
          temperatureC: doc?.tempC ?? null,
        };
      });
      return {
        lastUpdated: new Date().toISOString(),
        cards,
        source: 'firestore_fallback',
        warning: 'Dashboard route unavailable; using fallback crowd snapshots.',
      };
    } catch (fallbackErr) {
      return { error: 'Dashboard unavailable: ' + fallbackErr.message };
    }
  }
}

async function execGetDhamStatus() {
  const now = new Date();
  const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  const year = nowUtc.getUTCFullYear();
  let YEARLY;
  try { YEARLY = await YEARLY_OPENING_DATES_IMPORT(); } catch { YEARLY = {}; }
  const out = {};
  for (const k of DHAM_KEYS) {
    const info = DHAM_INFO[k];
    const openStr = YEARLY[year]?.[k];
    const open = openStr ? new Date(`${openStr}T12:00:00.000Z`)
      : new Date(Date.UTC(year, info.openingDate.month - 1, info.openingDate.day, 12));
    const close = new Date(Date.UTC(year, info.closingDate.month - 1, info.closingDate.day, 12));
    const isOpen = nowUtc >= open && nowUtc <= close;
    out[k] = {
      isOpen,
      openingDate: open.toISOString().slice(0, 10),
      closingDate: close.toISOString().slice(0, 10),
      daysUntilOpen: isOpen ? 0 : Math.max(0, Math.ceil((open - nowUtc) / 86400000)),
    };
  }
  return out;
}

async function execGetNearbyAttractions({ dhamName, dham } = {}) {
  const k = String(dhamName || dham || '').toLowerCase();
  const info = DHAM_INFO[k];
  if (!info) return { error: 'Unknown dham' };
  return { dham: k, displayName: info.displayName, nearbyAttractions: info.nearbyAttractions, crowdAlternatives: info.crowdAlternatives };
}

async function execWebSearch({ query } = {}) {
  return runWebSearch(query);
}

// ─── Authenticated user tools ───────────────────────────────────────────────

function resolveUserId(context) {
  if (!context.userId) return null;
  return context.userId;
}

async function execGetMyBookings(context, type) {
  const userId = resolveUserId(context);
  if (!userId) return { error: 'User not logged in. Please log in to view your bookings.' };
  const bookings = await Booking.find({ user: userId, bookingType: type }).sort({ createdAt: -1 });
  return { success: true, count: bookings.length, bookings };
}

async function execBookParking({ areaId, slotId, vehicleNumber }, context) {
  const userId = resolveUserId(context);
  if (!userId) return { error: 'User not logged in. Please log in to book.' };
  const parking = await Parking.findById(areaId);
  if (!parking) return { error: 'Parking area not found' };
  const slot = parking.slots.id(slotId);
  if (!slot) return { error: 'Slot not found' };
  if (slot.status !== 'available') return { error: `Slot is ${slot.status}, cannot book.` };
  const entry = new Date();
  const exit = new Date(entry.getTime() + 24 * 60 * 60 * 1000);
  const amount = slot.pricePerDay;
  const booking = new Booking({
    user: userId, bookingType: 'parking', status: 'confirmed',
    parking: { slotId: slot._id, areaId: parking._id, slotNumber: slot.slotNumber, vehicleNumber, entryTime: entry, exitTime: exit },
    amount, paymentStatus: 'pending',
  });
  await booking.save();
  const qrCode = await QRCode.toDataURL(JSON.stringify({ bookingId: booking._id, slotNumber: slot.slotNumber, vehicleNumber }));
  booking.parking.qrCode = qrCode;
  await booking.save();
  slot.status = 'reserved'; slot.bookedBy = userId; slot.bookingId = booking._id;
  parking.availableSlots -= 1;
  await parking.save();
  return { success: true, message: 'Parking booked!', booking: { id: booking._id, slotNumber: slot.slotNumber, vehicleNumber, amount, entryTime: entry, exitTime: exit } };
}

async function execBookHotel({ hotelId, checkIn, checkOut, guests, rooms }, context) {
  const userId = resolveUserId(context);
  if (!userId) return { error: 'User not logged in.' };
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) return { error: 'Hotel not found' };
  if (hotel.availableRooms < rooms) return { error: `Only ${hotel.availableRooms} rooms available.` };
  const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
  const amount = hotel.pricePerNight * rooms * nights;
  const booking = new Booking({
    user: userId, bookingType: 'hotel', status: 'confirmed',
    hotel: { hotelId, checkIn: new Date(checkIn), checkOut: new Date(checkOut), guests, rooms },
    amount, paymentStatus: 'pending',
  });
  await booking.save();
  hotel.availableRooms -= rooms;
  await hotel.save();
  return { success: true, message: 'Hotel booked!', booking: { id: booking._id, hotel: hotel.name, checkIn, checkOut, guests, rooms, amount } };
}

async function execBookTaxi({ taxiId, pickupLocation, dropoffLocation, pickupTime, distance }, context) {
  const userId = resolveUserId(context);
  if (!userId) return { error: 'User not logged in.' };
  const taxi = await Taxi.findById(taxiId);
  if (!taxi) return { error: 'Taxi not found' };
  if (!taxi.isAvailable) return { error: 'Taxi is not available.' };
  const estimatedFare = taxi.ratePerKm * distance;
  const booking = new Booking({
    user: userId, bookingType: 'taxi', status: 'confirmed',
    taxi: { taxiId, pickupLocation, dropoffLocation, pickupTime: new Date(pickupTime), distance, estimatedFare },
    amount: estimatedFare, paymentStatus: 'pending',
  });
  await booking.save();
  taxi.isAvailable = false;
  await taxi.save();
  return { success: true, message: 'Taxi booked!', booking: { id: booking._id, driver: taxi.driverName, vehicle: taxi.vehicleNumber, pickupTime, estimatedFare } };
}

async function execGetMyHourlyPasses(context) {
  const userId = resolveUserId(context);
  if (!userId) return { error: 'User not logged in.' };
  const passes = await CheckpointPass.find({ user: userId }).sort({ createdAt: -1 }).populate('checkpoint', 'name location');
  return { success: true, count: passes.length, passes };
}

async function execBookHourlyPass({ checkpointId, date, hour, vehicleOwnerName, vehicleOwnerPhone, vehicleNumber, numberOfPeople = 1 }, context) {
  const userId = resolveUserId(context);
  if (!userId) return { error: 'User not logged in.' };
  const checkpoint = await Checkpoint.findById(checkpointId);
  if (!checkpoint) return { error: 'Checkpoint not found' };
  const h = parseInt(hour, 10);
  const start = new Date(`${date}T${String(h).padStart(2, '0')}:00:00`);
  const end = new Date(`${date}T${String(h + 1).padStart(2, '0')}:00:00`);
  const booked = await CheckpointPass.countDocuments({ checkpoint: checkpointId, 'timeSlot.start': start, 'timeSlot.end': end, status: { $in: ['confirmed', 'pending'] } });
  if (booked >= checkpoint.maxPassesPerSlot) return { error: 'This time slot is full.' };
  const passId = CheckpointPass.generatePassId();
  const qrCode = await QRCode.toDataURL(JSON.stringify({ passId, checkpoint: checkpoint.name, date, hour: h }));
  const amount = checkpoint.pricePerHour * numberOfPeople;
  const pass = new CheckpointPass({
    user: userId, checkpoint: checkpointId, timeSlot: { start, end },
    vehicleOwnerName, vehicleOwnerPhone, vehicleNumber, numberOfPeople,
    qrCode, passId, status: 'confirmed', amount, paymentStatus: amount === 0 ? 'paid' : 'pending',
    bookingType: 'user',
  });
  await pass.save();
  return { success: true, message: 'Hourly pass booked!', pass: { passId, checkpoint: checkpoint.name, date, hour: h, amount, vehicleNumber } };
}
