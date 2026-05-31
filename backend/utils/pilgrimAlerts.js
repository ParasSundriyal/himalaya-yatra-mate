/**
 * Only show alerts that help pilgrims — hide pipeline/debug lines.
 */

const HIDDEN_PATTERNS = [
  /crowd snapshot for .+ from live firestore/i,
  /crowd snapshot for .+ is stale/i,
  /crowd for .+ on \d{4}-\d{2}-\d{2}: season \+ pass estimate/i,
  /openweather provides ~5-day forecasts/i,
  /weather forecast partially available/i,
  /live weather api unavailable/i,
  /could not reach openweather/i,
  /pass stats unavailable/i,
  /crowd ml service offline/i,
  /crowd data unavailable/i,
  /weather service error/i,
  /crowd service error/i,
];

/** De-dupe severe weather lines into one summary when many days match */
export function sanitizePilgrimAlerts(alerts = []) {
  const out = [];
  const severeDates = [];

  for (const raw of alerts) {
    const a = String(raw || '').trim();
    if (!a) continue;
    if (HIDDEN_PATTERNS.some((re) => re.test(a))) continue;

    const m = a.match(/^Severe weather risk on (\d{4}-\d{2}-\d{2}) near (.+)\.$/i);
    if (m) {
      severeDates.push({ date: m[1], place: m[2] });
      continue;
    }
    if (!out.includes(a)) out.push(a);
  }

  if (severeDates.length === 1) {
    const { date, place } = severeDates[0];
    out.push(
      `Rain likely on ${date} near ${place} — carry rain gear and confirm road status.`,
    );
  } else if (severeDates.length > 1) {
    const places = [...new Set(severeDates.map((x) => x.place))].join(', ');
    out.push(
      `Rain likely on ${severeDates.length} days (${places}) during monsoon season — pack waterproof layers and check road updates.`,
    );
  }

  return out;
}
