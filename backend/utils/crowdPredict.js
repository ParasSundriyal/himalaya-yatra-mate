import axios from 'axios';

const ML_URL =
  process.env.ML_SERVICE_URL ||
  process.env.CROWD_ML_URL ||
  'http://127.0.0.1:5001';

/**
 * Calls local Flask Random Forest service. Returns { level, confidence } or fallback.
 */
export async function predictCrowd({
  dham,
  date,
  weather_code = 1,
  pass_quota_pct = 0.5,
}) {
  try {
    const { data } = await axios.post(
      `${ML_URL}/predict`,
      { dham, date, weather_code, pass_quota_pct },
      { timeout: 4000 },
    );
    return {
      level: data.level || 'Medium',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
    };
  } catch {
    return { level: 'Medium', confidence: 0.4 };
  }
}
