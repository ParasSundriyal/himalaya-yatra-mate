import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import Itinerary from '../models/Itinerary.model.js';
import { fetchWeatherMapForDhams } from '../services/weatherService.js';
import { fetchCrowdMap } from '../services/crowdService.js';
import {
  generateItinerary,
  validateDhamDates,
} from '../services/decisionTree.js';
import {
  buildFacilitiesPerDham,
  attachCrowdLevels,
} from '../services/itineraryFacilities.js';
import {
  DHAM_INFO,
  DHAM_KEYS,
  YEARLY_OPENING_DATES,
} from '../constants/dhamData.js';

const router = express.Router();

const ML_BASE =
  process.env.ML_SERVICE_URL || process.env.CROWD_ML_URL || 'http://localhost:5001';

const DISPLAY_TO_KEY = {
  Yamunotri: 'yamunotri',
  Gangotri: 'gangotri',
  Kedarnath: 'kedarnath',
  Badrinath: 'badrinath',
};

function ageFromDob(dob) {
  if (!dob) return 40;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.max(1, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

function mapHealthConditions(mongoArr = []) {
  const out = new Set();
  for (const h of mongoArr) {
    if (h === 'heart') out.add('heartCondition');
    else if (h === 'bp') out.add('highBP');
    else if (h === 'knee') out.add('kneePain');
    else if (h === 'asthma') out.add('asthma');
    else if (h === 'diabetes') out.add('diabetes');
    else if (h === 'pregnancy') out.add('pregnancy');
    else if (h === 'none') out.add('none');
    else out.add(h);
  }
  return [...out];
}

function buildUserProfile(user) {
  return {
    name: user.name,
    age: ageFromDob(user.dateOfBirth),
    healthConditions: mapHealthConditions(user.healthConditions),
    fitnessLevel: user.fitnessLevel || 'moderate',
    vehicle: user.vehicle
      ? {
          type: user.vehicle.vehicleType,
          vehicleType: user.vehicle.vehicleType,
          regNumber: user.vehicle.registrationNumber,
          passengers: user.vehicle.passengers ?? 0,
        }
      : null,
    emergencyContact: user.emergencyContact || null,
  };
}

function validateSeason(startDateStr) {
  const [, m, day] = startDateStr.split('-').map(Number);
  if (m < 5) {
    return 'Chardham Yatra season runs May to November only.';
  }
  if (m > 11 || (m === 11 && day > 15)) {
    return 'Chardham Yatra season runs May to November only.';
  }
  return null;
}

function uniqueDhamsFromPlan(result) {
  const set = new Set(
    (result.selectedDhams || []).map((d) => String(d).toLowerCase()),
  );
  for (const day of result.days || []) {
    if (day.dham) {
      const k = DISPLAY_TO_KEY[day.dham] || String(day.dham).toLowerCase();
      if (DHAM_KEYS.includes(k)) set.add(k);
    }
  }
  return [...set];
}

async function fetchMlBatchForTrip(body, uniqueDhams, dayDates) {
  const dates = [...new Set(dayDates)].slice(0, 14);
  if (!dates.length) return {};
  const out = {};
  await Promise.allSettled(
    uniqueDhams.map(async (dham) => {
      try {
        const { data } = await axios.post(
          `${ML_BASE}/predict-batch`,
          {
            requests: dates.map((date) => ({
              dham,
              date,
              weather_code: 0,
              pass_quota_pct: 0.5,
            })),
          },
          { timeout: 12000 },
        );
        if (Array.isArray(data)) {
          out[dham] = data;
        }
      } catch {
        /* optional */
      }
    }),
  );
  return out;
}

function openingClosingStatus() {
  const now = new Date();
  const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
  const year = nowUtc.getUTCFullYear();
  const out = {};
  for (const k of DHAM_KEYS) {
    const info = DHAM_INFO[k];
    const openStr = YEARLY_OPENING_DATES[year]?.[k];
    const open = openStr
      ? new Date(`${openStr}T12:00:00.000Z`)
      : new Date(Date.UTC(year, info.openingDate.month - 1, info.openingDate.day, 12, 0, 0));
    const close = new Date(
      Date.UTC(year, info.closingDate.month - 1, info.closingDate.day, 12, 0, 0),
    );
    const isOpen = nowUtc >= open && nowUtc <= close;
    const daysUntilOpen = isOpen
      ? 0
      : Math.max(0, Math.ceil((open - nowUtc) / (86400000)));
    out[k] = {
      isOpen,
      openingDate: open.toISOString().slice(0, 10),
      closingDate: close.toISOString().slice(0, 10),
      daysUntilOpen,
    };
  }
  return out;
}

router.get('/dham-status', authenticate, (req, res) => {
  try {
    res.json(openingClosingStatus());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/nearby/:dhamName', authenticate, (req, res) => {
  const k = String(req.params.dhamName || '').toLowerCase();
  const info = DHAM_INFO[k];
  if (!info) {
    return res.status(404).json({ message: 'Unknown dham' });
  }
  res.json({
    dham: k,
    displayName: info.displayName,
    nearbyAttractions: info.nearbyAttractions,
    crowdAlternatives: info.crowdAlternatives,
  });
});

router.post(
  '/generate',
  authenticate,
  [
    body('groupSize').isInt({ min: 1, max: 50 }),
    body('startDate').matches(/^\d{4}-\d{2}-\d{2}$/),
    body('budget').isFloat({ min: 1000, max: 5000000 }),
    body('pace').isIn(['relaxed', 'moderate', 'express']),
    body('accommodation').isIn(['budget', 'midrange', 'premium']),
    body('travelMode').isIn(['road', 'helicopter', 'mixed']),
    body('sideTrips').isBoolean(),
    body('diet').optional().isIn(['vegetarian', 'sattvic', 'any']),
    body('kedarnathTravel')
      .optional()
      .isIn(['trek', 'pony', 'helicopter', 'auto']),
    body('mode').optional().isIn(['single', 'all4']),
    body('selectedDhams').optional().isArray(),
    body('selectedDhams.*').optional().isString(),
    body('vehicleType')
      .optional()
      .isIn(['none', 'bike', 'car', 'suv', 'bus']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user._id).select(
        'name email dateOfBirth healthConditions fitnessLevel vehicle emergencyContact pilgrimId',
      );
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (!user.pilgrimId) {
        return res.status(400).json({
          message:
            'Complete pilgrim registration to generate a saved itinerary.',
        });
      }

      const body = req.body;
      const mode = body.mode === 'single' ? 'single' : 'all4';
      const selectedDhams = (
        body.selectedDhams?.length
          ? body.selectedDhams
          : mode === 'single'
            ? ['kedarnath']
            : [...DHAM_KEYS]
      ).map((d) => String(d).toLowerCase());

      if (mode === 'single' && selectedDhams.length !== 1) {
        return res.status(400).json({
          message: 'Single mode requires exactly one dham in selectedDhams.',
        });
      }
      for (const d of selectedDhams) {
        if (!DHAM_KEYS.includes(d)) {
          return res.status(400).json({ message: `Invalid dham: ${d}` });
        }
      }

      const start = new Date(`${body.startDate}T12:00:00.000Z`);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (start < today) {
        return res.status(400).json({ message: 'Start date must be in the future.' });
      }

      const seasonErr = validateSeason(body.startDate);
      if (seasonErr) {
        return res.status(400).json({ message: seasonErr });
      }

      const year = new Date(`${body.startDate}T12:00:00.000Z`).getUTCFullYear();
      const dateVal = validateDhamDates(selectedDhams, body.startDate, year, {
        mode,
        pace: body.pace,
        sideTrips: body.sideTrips,
      });
      const seasonDateWarnings = [
        ...(dateVal.warnings || []),
        ...(dateVal.closedDhams || []).map(
          (c) =>
            `${c.displayName}: planned visit ${c.visitDate} is outside the usual shrine season window (${c.openingDate} – ${c.closingDate}). You can still plan; verify dates with official notices.`,
        ),
      ];

      const userProfile = buildUserProfile(user);
      const bodyForTree = {
        ...body,
        mode,
        selectedDhams,
        diet: body.diet || 'vegetarian',
        vehicleType: body.vehicleType || 'none',
      };

      let weatherMap = {};
      let crowdMap = {};
      const allAlerts = [];

      const settled = await Promise.allSettled([
        fetchWeatherMapForDhams(body.startDate),
        fetchCrowdMap(body.startDate),
      ]);

      if (settled[0].status === 'fulfilled') {
        weatherMap = settled[0].value.weatherMap;
        allAlerts.push(...settled[0].value.alerts);
      } else {
        allAlerts.push('Live weather partially unavailable — using seasonal defaults.');
      }
      if (settled[1].status === 'fulfilled') {
        crowdMap = settled[1].value.crowdMap;
        allAlerts.push(...settled[1].value.alerts);
      } else {
        allAlerts.push('Crowd levels estimated from defaults.');
      }

      let result;
      try {
        result = generateItinerary(userProfile, bodyForTree, weatherMap, crowdMap);
      } catch (e) {
        console.error('Decision tree error:', e);
        return res.status(500).json({
          message: 'Itinerary generation failed',
          error: process.env.NODE_ENV === 'development' ? e.message : undefined,
        });
      }

      const dayDates = (result.days || []).map((d) => d.date);
      const uDhams = uniqueDhamsFromPlan(result);
      const mlSettled = await Promise.allSettled([
        fetchMlBatchForTrip(body, uDhams, dayDates),
        buildFacilitiesPerDham(uDhams, body.accommodation, body.vehicleType || 'none'),
      ]);

      let facilitiesPerDham = {};
      if (mlSettled[1].status === 'fulfilled') {
        facilitiesPerDham = attachCrowdLevels(mlSettled[1].value, crowdMap);
      }
      const mlForecasts = mlSettled[0].status === 'fulfilled' ? mlSettled[0].value : {};

      for (const k of uDhams) {
        if (!facilitiesPerDham[k]) facilitiesPerDham[k] = { hotels: [], parking: [], checkpoints: [], taxis: [] };
        const ins = result.insightsByDham?.[k];
        facilitiesPerDham[k].nearbyAttractions =
          ins?.nearbyAttractions || DHAM_INFO[k]?.nearbyAttractions || [];
        facilitiesPerDham[k].alternatives = ins?.alternatives || [];
      }

      result.alerts = [...new Set([...(result.alerts || []), ...allAlerts])];
      if (seasonDateWarnings.length) {
        result.alerts = [...new Set([...result.alerts, ...seasonDateWarnings])];
      }
      if (bodyForTree.diet === 'sattvic') {
        result.alerts.push(
          'Sattvic diet: prefer simple meals at trusted dhabas; avoid heavy spices at altitude.',
        );
      }

      const closedDhamWarnings = seasonDateWarnings;

      const responsePayload = {
        ...result,
        pilgrimName: userProfile.name,
        selectedDhams,
        facilitiesPerDham,
        mlForecasts,
        closedDhamWarnings,
      };

      const { insightsByDham, kedarnathMode, dhamOrder, ...toSave } = responsePayload;
      const resultClean = {
        ...toSave,
        _meta: { insightsByDham, kedarnathMode, dhamOrder, diet: bodyForTree.diet },
      };

      const saved = await Itinerary.findOneAndUpdate(
        { pilgrimId: user.pilgrimId },
        {
          $set: {
            userId: user._id,
            pilgrimId: user.pilgrimId,
            inputParams: bodyForTree,
            weatherSnapshot: weatherMap,
            crowdSnapshot: crowdMap,
            result: resultClean,
            generatedAt: new Date(),
            version: 2,
          },
        },
        { upsert: true, new: true },
      );

      res.json({
        ...responsePayload,
        itineraryId: saved._id.toString(),
        saved: true,
      });
    } catch (error) {
      console.error('Itinerary generate error:', error);
      res.status(500).json({
        message: 'Failed to generate itinerary',
        error: error.message,
      });
    }
  },
);

router.get('/mine', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('pilgrimId');
    if (!user?.pilgrimId) {
      return res.status(404).json({ message: 'No itinerary generated yet.' });
    }

    const doc = await Itinerary.findOne({ pilgrimId: user.pilgrimId }).sort({
      generatedAt: -1,
    });

    if (!doc) {
      return res.status(404).json({ message: 'No itinerary generated yet.' });
    }

    res.json({
      itineraryId: doc._id.toString(),
      generatedAt: doc.generatedAt,
      result: doc.result,
      inputParams: doc.inputParams,
    });
  } catch (e) {
    console.error('Itinerary mine error:', e);
    res.status(500).json({ message: 'Failed to load itinerary' });
  }
});

export default router;
