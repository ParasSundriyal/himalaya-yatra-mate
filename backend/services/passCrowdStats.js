import DhamPass from '../models/DhamPass.model.js';
import { DHAM_DAILY_QUOTA } from './crowdSignals.js';

const DHAM_DISPLAY = {
  yamunotri: 'Yamunotri',
  gangotri: 'Gangotri',
  kedarnath: 'Kedarnath',
  badrinath: 'Badrinath',
};

function dayBounds(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { start, end };
}

/**
 * Today's issued passes vs daily quota for one dham.
 */
export async function getPassCrowdStats(dhamKey, dateStr) {
  const key = String(dhamKey || '').toLowerCase();
  const display = DHAM_DISPLAY[key];
  const quota = DHAM_DAILY_QUOTA[key] ?? 2000;

  if (!display) {
    return { issued: 0, quota, utilization: 0, level: 'Medium' };
  }

  const { start, end } = dayBounds(dateStr);
  let issued = 0;
  try {
    issued = await DhamPass.countDocuments({
      dham: display,
      visitDate: { $gte: start, $lt: end },
      status: { $in: ['active', 'used'] },
    });
  } catch (e) {
    console.warn('[passCrowdStats] count failed', e.message);
  }

  const utilization = quota > 0 ? Math.min(1, issued / quota) : 0;
  return { issued, quota, utilization };
}

export async function getAllPassCrowdStats(dateStr) {
  const keys = Object.keys(DHAM_DAILY_QUOTA);
  const entries = await Promise.all(
    keys.map(async (k) => {
      const stats = await getPassCrowdStats(k, dateStr);
      return [k, stats];
    }),
  );
  return Object.fromEntries(entries);
}
