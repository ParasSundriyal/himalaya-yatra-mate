import { executeTool } from './tools.js';
import { detectQueryIntent, extractDham, capitalizeDham } from './queryIntent.js';
import { compressToolPayload } from './tokenOptimizer.js';
import { rememberDhamFromMessage, resolveDham } from './dhamContext.js';

function extractLocation(message = '', dham = null) {
  const known = [
    'kedarnath', 'badrinath', 'gangotri', 'yamunotri',
    'haridwar', 'rishikesh', 'dehradun', 'gaurikund', 'joshimath', 'uttarkashi',
  ];
  const lower = message.toLowerCase().trim();
  return known.find((loc) => lower.includes(loc)) || dham || null;
}

/**
 * Intent-aware prefetch — only fetches data relevant to the query type.
 */
export async function prefetchToolsForMessage(message, context) {
  const userId = context?.userId;
  rememberDhamFromMessage(message, userId);
  const dham = resolveDham(message, userId);
  const intent = detectQueryIntent(message);
  const location = extractLocation(message, dham);
  const results = [];

  async function runTool(name, args) {
    try {
      const data = await executeTool(name, args, context);
      if (data && !data.error) {
        results.push({ tool: name, data });
      }
    } catch (err) {
      console.warn(`[DhamSarthi] Prefetch ${name} failed:`, err.message);
    }
  }

  const tasks = [];

  switch (intent) {
    case 'weather':
      if (dham) tasks.push(runTool('get_weather', { dhamName: dham }));
      break;

    case 'crowd_status':
      if (dham) tasks.push(runTool('get_crowd_live', { dhamName: dham }));
      tasks.push(runTool('get_dashboard_live', {}));
      break;

    case 'hotel_search':
      if (location || dham) {
        tasks.push(runTool('get_hotels', { location: location || dham }));
      }
      break;

    case 'temple_info':
      tasks.push(runTool('web_search', { query: message.trim() }));
      break;

    case 'darshan':
      tasks.push(runTool('get_dham_status', {}));
      break;

    case 'nearby_places':
      if (dham) tasks.push(runTool('get_nearby_attractions', { dhamName: dham }));
      break;

    case 'route':
    case 'travel_plan':
      if (dham) {
        tasks.push(
          runTool('web_search', {
            query: `${capitalizeDham(dham)} route how to reach Char Dham yatra`,
          }),
        );
      } else if (extractDham(message)) {
        const named = extractDham(message);
        tasks.push(
          runTool('web_search', {
            query: `${capitalizeDham(named)} route how to reach Char Dham yatra`,
          }),
        );
      }
      break;

    case 'packing_checklist':
      tasks.push(
        runTool('web_search', {
          query: `${dham || 'Char Dham'} packing list yatra essentials`,
        }),
      );
      break;

    case 'emergency':
      break;

    default:
      if (/hotel|stay|room/.test(message.toLowerCase()) && (location || dham)) {
        tasks.push(runTool('get_hotels', { location: location || dham }));
      } else if (/taxi|cab/.test(message.toLowerCase()) && (location || dham)) {
        tasks.push(runTool('get_taxis', { location: location || dham }));
      } else if (/parking/.test(message.toLowerCase())) {
        tasks.push(runTool('get_parking_areas', {}));
      } else if (/my booking/.test(message.toLowerCase())) {
        tasks.push(runTool('get_my_hotel_bookings', {}));
        tasks.push(runTool('get_my_parking_bookings', {}));
      }
      break;
  }

  await Promise.all(tasks.filter(Boolean));
  return results;
}

export function formatPrefetchContext(prefetched = []) {
  if (!prefetched.length) return '';
  return prefetched
    .map(({ tool, data }) => `[${tool}] ${JSON.stringify(compressToolPayload(tool, data))}`)
    .join('\n');
}

export function prefetchedAsToolMessages(prefetched = []) {
  return prefetched.map(({ tool, data }, i) => ({
    role: 'tool',
    tool_call_id: `prefetch-${i}`,
    content: JSON.stringify({ tool, ...data }),
  }));
}
