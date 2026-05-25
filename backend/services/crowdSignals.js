/**
 * Season, pass-quota, and display helpers for crowd blending.
 * Uses official Char Dham season windows and daily pass quotas from passes.routes.js.
 */

/** Daily pass caps (same as passes.routes.js) */
export const DHAM_DAILY_QUOTA = {
  yamunotri: 2000,
  gangotri: 3000,
  kedarnath: 1500,
  badrinath: 5000,
};

/** Approximate opening / closing (month, day) per dham */
export const DHAM_SEASON = {
  yamunotri: { open: { month: 4, day: 22 }, close: { month: 10, day: 2 } },
  gangotri: { open: { month: 4, day: 22 }, close: { month: 10, day: 14 } },
  kedarnath: { open: { month: 4, day: 25 }, close: { month: 10, day: 25 } },
  badrinath: { open: { month: 4, day: 27 }, close: { month: 10, day: 20 } },
};

/** Relative popularity during peak yatra (Kedarnath / Badrinath busiest) */
const DHAM_POPULARITY = {
  yamunotri: 0.85,
  gangotri: 0.9,
  kedarnath: 1.15,
  badrinath: 1.1,
};

export function levelToScore(level) {
  if (level === 'Low') return 0;
  if (level === 'High') return 2;
  return 1;
}

export function scoreToLevel(score) {
  if (score < 0.55) return 'Low';
  if (score < 1.35) return 'Medium';
  return 'High';
}

/** Map blended score (0–2) to a dashboard bar percentage */
export function scoreToCrowdPct(score) {
  const pct = Math.round(18 + (Math.min(2, Math.max(0, score)) / 2) * 77);
  return Math.min(96, Math.max(12, pct));
}

export function crowdColorForLevel(level) {
  if (level === 'High') return '#DC2626';
  if (level === 'Low') return '#059669';
  return '#D97706';
}

function parseDate(dateStr) {
  const [y, m, d] = String(dateStr || '').split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function isDateInSeasonWindow(d, season) {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const { open, close } = season;
  if (month > open.month && month < close.month) return true;
  if (month === open.month && day >= open.day) return true;
  if (month === close.month && day <= close.day) return true;
  return false;
}

export function isDhamInSeason(dhamKey, dateStr) {
  const key = String(dhamKey || '').toLowerCase();
  const season = DHAM_SEASON[key];
  if (!season) return false;
  return isDateInSeasonWindow(parseDate(dateStr), season);
}

/** Days since this dham's opening day in the current calendar year */
export function daysSinceDhamOpening(dhamKey, dateStr) {
  const key = String(dhamKey || '').toLowerCase();
  const season = DHAM_SEASON[key];
  if (!season) return 999;
  const d = parseDate(dateStr);
  const open = new Date(d.getFullYear(), season.open.month - 1, season.open.day);
  const diff = Math.floor((d - open) / (24 * 60 * 60 * 1000));
  return diff;
}

/**
 * Expected crowd pressure from calendar (opening season, peak months, weekends).
 * Returns score 0–2 (same scale as levelToScore).
 */
export function getSeasonCrowdScore(dhamKey, dateStr) {
  const key = String(dhamKey || '').toLowerCase();
  if (!isDhamInSeason(key, dateStr)) return 0;

  const d = parseDate(dateStr);
  const month = d.getMonth() + 1;
  const dayOfWeek = d.getDay();
  const daysOpen = daysSinceDhamOpening(key, dateStr);
  const pop = DHAM_POPULARITY[key] ?? 1;

  let score = 0.75 * pop;

  // Opening fortnight — temples just opened, heavy rush
  if (daysOpen >= 0 && daysOpen <= 14) {
    score += 0.55;
  } else if (daysOpen >= 15 && daysOpen <= 45) {
    score += 0.45;
  }

  // Peak yatra: May–mid June
  if (month === 5 || (month === 6 && d.getDate() <= 20)) {
    score += 0.35;
  } else if (month >= 6 && month <= 8) {
    score += 0.2;
  } else if (month >= 9) {
    score += 0.08;
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    score += 0.12;
  }

  // Akshaya Tritiya / early May cluster
  if (month === 5 && d.getDate() <= 10) {
    score += 0.15;
  }

  return Math.min(2, Math.max(0.4, score));
}

export function seasonScoreToLevel(score) {
  return scoreToLevel(score);
}

/** Pass utilization 0–1 → crowd level (adjusted for opening season) */
export function passUtilizationToLevel(utilization, dhamKey, dateStr) {
  const key = String(dhamKey || '').toLowerCase();
  const inSeason = isDhamInSeason(key, dateStr);
  const daysOpen = daysSinceDhamOpening(key, dateStr);
  const u = Math.min(1, Math.max(0, utilization));

  if (!inSeason) {
    return u >= 0.5 ? 'Medium' : 'Low';
  }

  // During opening weeks, real-world rush even when app passes are still low
  if (daysOpen >= 0 && daysOpen <= 21 && u < 0.25) {
    return daysOpen <= 7 ? 'High' : 'Medium';
  }

  if (u < 0.18) return 'Low';
  if (u < 0.45) return 'Medium';
  if (u < 0.72) return 'High';
  return 'High';
}

export function waitMinutesForCrowd(level, utilization = 0, gpsCount = 0) {
  const u = Math.min(1, Math.max(0, utilization));
  const gpsBoost = Math.min(40, gpsCount * 0.5);

  if (level === 'High') {
    return Math.round(140 + u * 120 + gpsBoost);
  }
  if (level === 'Low') {
    return Math.round(20 + u * 25 + gpsBoost * 0.3);
  }
  return Math.round(50 + u * 70 + gpsBoost * 0.6);
}
