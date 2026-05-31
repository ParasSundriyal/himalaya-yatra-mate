/**
 * Groq sometimes emits malformed tool names like web_search{"query":"..."}.
 * Recover { name, args } from the API error message.
 */
export function parseMalformedToolCallFromError(errorMessage = '') {
  const msg = String(errorMessage);
  const match = msg.match(/attempted to call tool '([^']+)'/i);
  if (!match) return null;

  const raw = match[1].trim();
  const jsonSuffix = raw.match(/^([a-z_][a-z0-9_]*)(\{.+\})$/i);
  if (jsonSuffix) {
    const name = jsonSuffix[1];
    try {
      const args = JSON.parse(jsonSuffix[2]);
      return { name, args };
    } catch {
      return { name, args: {} };
    }
  }

  const knownTools = [
    'web_search',
    'get_hotels',
    'get_taxis',
    'get_parking_areas',
    'get_crowd_live',
    'get_dashboard_live',
    'get_dham_status',
    'get_nearby_attractions',
  ];
  if (knownTools.includes(raw)) {
    return { name: raw, args: {} };
  }

  return null;
}

/**
 * Normalize OpenAI-format tool_calls (fix embedded JSON in function.name).
 */
export function normalizeToolCalls(toolCalls = []) {
  if (!Array.isArray(toolCalls)) return [];

  return toolCalls.map((tc, idx) => {
    let name = tc?.function?.name || '';
    let argsRaw = tc?.function?.arguments || '{}';

    const embedded = name.match(/^([a-z_][a-z0-9_]*)(\{.+\})$/i);
    if (embedded) {
      name = embedded[1];
      if (!argsRaw || argsRaw === '{}') {
        argsRaw = embedded[2];
      }
    }

    let args = {};
    try {
      args = JSON.parse(argsRaw || '{}');
    } catch {
      args = {};
    }

    return {
      id: tc.id || `tool-${idx}`,
      type: 'function',
      function: { name, arguments: JSON.stringify(args) },
      parsed: { name, args },
    };
  });
}
