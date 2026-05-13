import axios from 'axios';

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chardham-chat';

/**
 * Calls n8n webhook for dynamic intents.
 * Returns parsed response ({ reply, intent }) or null when unavailable.
 */
export async function fetchN8nReply(payload) {
  try {
    const { data } = await axios.post(N8N_WEBHOOK_URL, payload, {
      timeout: 3500,
      headers: { 'Content-Type': 'application/json' },
    });

    if (!data || typeof data.reply !== 'string') {
      return null;
    }

    return {
      reply: data.reply,
      intent: typeof data.intent === 'string' ? data.intent : payload.intent,
    };
  } catch (error) {
    // n8n is optional for dynamic data; chatbot must keep working offline.
    return null;
  }
}
