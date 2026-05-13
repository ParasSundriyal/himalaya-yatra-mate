import { predictCrowd } from '../utils/crowdPredict.js';

const DHAMS = ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'];

const TEMPLATES = {
  A: {
    label: 'Leisure (senior-friendly)',
    baseDays: 12,
    baseCostPerPerson: 28000,
    pace: 'slow',
  },
  B: {
    label: 'Balanced Char Dham',
    baseDays: 10,
    baseCostPerPerson: 32000,
    pace: 'moderate',
  },
  C: {
    label: 'Standard circuit',
    baseDays: 9,
    baseCostPerPerson: 30000,
    pace: 'moderate',
  },
  D: {
    label: 'Active trek focus',
    baseDays: 11,
    baseCostPerPerson: 35000,
    pace: 'active',
  },
  E: {
    label: 'Budget compact',
    baseDays: 8,
    baseCostPerPerson: 24000,
    pace: 'fast',
  },
};

function pickTemplateKey(input) {
  const {
    groupSize,
    eldestAge,
    healthFlags = [],
    travelMode,
    budgetPerPerson,
    pace,
    sideTrips,
  } = input;

  if (
    eldestAge >= 65 ||
    healthFlags.length >= 2 ||
    healthFlags.includes('heart') ||
    healthFlags.includes('bp')
  ) {
    return 'A';
  }
  if (travelMode === 'private' && (budgetPerPerson ?? 0) >= 35000) {
    return 'D';
  }
  if ((budgetPerPerson ?? 0) < 26000 || sideTrips === false) {
    return 'E';
  }
  if (groupSize >= 6) {
    return 'B';
  }
  if (pace === 'slow') return 'A';
  if (pace === 'active') return 'D';
  return 'C';
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function healthWarnings(healthFlags = [], pace) {
  const alerts = [];
  if (healthFlags.includes('asthma') || healthFlags.includes('bp')) {
    alerts.push('Carry prescribed medication and avoid rapid altitude gain.');
  }
  if (healthFlags.includes('diabetes')) {
    alerts.push('Keep glucose supplies and stable meal timings on travel days.');
  }
  if (pace === 'slow' || healthFlags.includes('knee')) {
    alerts.push('Allow shorter road segments and extra rest breaks.');
  }
  return alerts;
}

export async function generateItinerary(input) {
  const templateKey = pickTemplateKey(input);
  const tpl = TEMPLATES[templateKey];
  const start = new Date(input.startDate);
  const alerts = healthWarnings(input.healthFlags, input.pace);

  const days = [];

  for (let i = 0; i < tpl.baseDays; i++) {
    const dayDate = addDays(start, i);
    const dham = DHAMS[i % 4];
    let crowdNote = 'Medium';

    try {
      const pred = await predictCrowd({
        dham,
        date: formatDate(dayDate),
        weather_code: 1,
      });
      crowdNote = pred.level || 'Medium';
      if (pred.level === 'High') {
        alerts.push(
          `High crowd expected near ${dham} on ${formatDate(dayDate)} — start earlier.`,
        );
      }
    } catch {
      // ML down
    }

    days.push({
      day: i + 1,
      date: formatDate(dayDate),
      title: `${dham} — Day ${i + 1}`,
      location: dham,
      events: [
        {
          time: '06:00',
          title: 'Travel / darshan window',
          note: `Crowd outlook: ${crowdNote}`,
        },
        {
          time: '13:00',
          title: 'Meal & rest',
          note: input.diet === 'veg' ? 'Vegetarian meals' : 'Meals per preference',
        },
      ],
      estimatedCost: Math.round(tpl.baseCostPerPerson / tpl.baseDays),
      warning: crowdNote === 'High' ? 'Queues likely — keep buffer.' : null,
    });
  }

  const totalCostPerPerson = tpl.baseCostPerPerson + (input.groupSize > 8 ? 2000 : 0);

  return {
    template: templateKey,
    templateLabel: tpl.label,
    totalDays: tpl.baseDays,
    totalCostPerPerson,
    summary: `${tpl.label}: ${tpl.baseDays}-day plan from ${formatDate(start)} (${tpl.pace} pace).`,
    alerts,
    days,
  };
}
