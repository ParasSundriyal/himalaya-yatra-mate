/**
 * In-memory conversation history store.
 *
 * Configurable via env vars:
 *   CHAT_MEMORY_MAX_MESSAGES   — max messages per user (default 20, i.e. 10 exchanges)
 *   CHAT_MEMORY_TTL_MINUTES    — auto-expire after N minutes of inactivity (default 30)
 */

const DEFAULT_MAX_MESSAGES = parseInt(process.env.CHAT_MEMORY_MAX_MESSAGES || '20', 10);
const DEFAULT_TTL_MS =
  parseInt(process.env.CHAT_MEMORY_TTL_MINUTES || '30', 10) * 60 * 1000;

// Store: userId → { messages: [...], lastAccess: Date }
const store = new Map();

// ─── Cleanup Timer ──────────────────────────────────────────────────────────
let cleanupInterval = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const ttl = parseInt(process.env.CHAT_MEMORY_TTL_MINUTES || '30', 10) * 60 * 1000;
    for (const [key, entry] of store) {
      if (now - entry.lastAccess > ttl) {
        store.delete(key);
      }
    }
  }, 60_000); // check every minute
  // Allow the process to exit even if the timer is running
  cleanupInterval.unref?.();
}

startCleanup();

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get the conversation history for a user.
 * Returns an array of OpenAI-format messages (role + content).
 */
export function getHistory(userId) {
  const key = resolveKey(userId);
  const entry = store.get(key);
  if (!entry) return [];
  entry.lastAccess = Date.now();
  return entry.messages;
}

/**
 * Trimmed history for LLM calls — last 4 messages, assistant JSON reduced to summary.
 */
export function getCompactHistory(userId, maxMessages = 4) {
  const history = getHistory(userId);
  return history.slice(-maxMessages).map((msg) => {
    if (msg.role !== 'assistant' || typeof msg.content !== 'string') return msg;
    try {
      const parsed = JSON.parse(msg.content);
      if (parsed?.summary) {
        return { role: 'assistant', content: parsed.summary };
      }
    } catch {
      /* plain text */
    }
    if (msg.content.length > 240) {
      return { role: 'assistant', content: msg.content.slice(0, 240) + '…' };
    }
    return msg;
  });
}

/**
 * Append messages to a user's conversation history.
 * @param {string} userId
 * @param {Array} messages — OpenAI-format messages to append
 */
export function addMessages(userId, messages) {
  const key = resolveKey(userId);
  let entry = store.get(key);
  if (!entry) {
    entry = { messages: [], lastAccess: Date.now() };
    store.set(key, entry);
  }

  entry.messages.push(...messages);
  entry.lastAccess = Date.now();

  // Trim to max size (keep most recent)
  const max = parseInt(process.env.CHAT_MEMORY_MAX_MESSAGES || String(DEFAULT_MAX_MESSAGES), 10);
  if (entry.messages.length > max) {
    entry.messages = entry.messages.slice(-max);
  }
}

/**
 * Clear conversation history for a user.
 */
export function clearHistory(userId) {
  store.delete(resolveKey(userId));
}

/**
 * Get total number of active conversations (for debugging/monitoring).
 */
export function getActiveCount() {
  return store.size;
}

// ─── Internals ──────────────────────────────────────────────────────────────

function resolveKey(userId) {
  return userId && typeof userId === 'string' ? userId : 'anonymous';
}
