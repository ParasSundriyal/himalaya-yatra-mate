import axios from 'axios';

// ─── Provider Configuration ─────────────────────────────────────────────────
const PROVIDER_CONFIGS = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-20b',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  // Google Gemini via OpenAI-compatible API (https://ai.google.dev/gemini-api/docs/openai)
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
  },
};

// ─── Base Provider Class ────────────────────────────────────────────────────
class LLMProvider {
  constructor(apiKey, model, baseUrl) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  /**
   * Sends a chat completion request with optional tool definitions.
   *
   * @param {Object} params
   * @param {Array}  params.messages    - OpenAI-format messages array
   * @param {Array}  [params.tools]     - OpenAI-format tool definitions
   * @param {string} [params.toolChoice] - 'auto' | 'none' | specific tool
   * @param {number} [params.maxTokens] - Max tokens for the response
   * @param {number} [params.temperature] - Sampling temperature
   *
   * @returns {Promise<{content: string|null, toolCalls: Array|null, usage: Object}>}
   */
  async chatCompletion({ messages, tools, toolChoice = 'auto', maxTokens = 1024, temperature = 0.7 }) {
    const body = {
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    // Only include tools/tool_choice if tools are provided
    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = toolChoice;
    }

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/chat/completions`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 60000, // 60s — tool-calling can take a while
        },
      );

      const choice = data.choices?.[0];
      if (!choice) {
        return { content: null, toolCalls: null, usage: data.usage || {} };
      }

      const message = choice.message;
      return {
        content: message.content || null,
        toolCalls: message.tool_calls || null,
        finishReason: choice.finish_reason,
        usage: data.usage || {},
        // Pass the raw message so the caller can append it to conversation
        rawMessage: message,
      };
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.error?.message || error.message;
      console.error(`[LLMProvider] ${this.model} request failed (${status}):`, detail);
      throw new Error(`LLM request failed: ${detail}`);
    }
  }
}

// ─── Factory Function ───────────────────────────────────────────────────────

/**
 * Creates an LLM provider instance based on environment configuration.
 *
 * Env vars:
 *   LLM_PROVIDER  — 'groq' | 'openai' | 'google' | 'gemini'  (default: 'groq')
 *   LLM_MODEL     — model identifier    (default: provider-specific)
 *   LLM_API_KEY   — API key             (required)
 *   LLM_BASE_URL  — custom base URL     (optional override)
 */
export function createProvider(overrides = {}) {
  const providerName = (overrides.provider || process.env.LLM_PROVIDER || 'groq').toLowerCase();
  const config = PROVIDER_CONFIGS[providerName];

  if (!config) {
    throw new Error(
      `Unknown LLM provider "${providerName}". Supported: ${Object.keys(PROVIDER_CONFIGS).join(', ')}`,
    );
  }

  const apiKey = overrides.apiKey || process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable is required');
  }

  const model = overrides.model || process.env.LLM_MODEL || config.defaultModel;
  // For built-in providers, ignore LLM_BASE_URL unless it looks like an OpenAI-compat root (ends with /v1 or /openai)
  const envBase = process.env.LLM_BASE_URL?.trim();
  const useEnvBase =
    envBase &&
    (envBase.endsWith('/v1') ||
      envBase.endsWith('/openai') ||
      envBase.includes('/openai/'));
  const baseUrl = overrides.baseUrl || (useEnvBase ? envBase : config.baseUrl);

  return new LLMProvider(apiKey, model, baseUrl);
}

export { LLMProvider, PROVIDER_CONFIGS };
