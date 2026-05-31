import { createProvider } from './llmProvider.js';
import { TOOL_GATHERING_SYSTEM } from './dhamSarthiPrompt.js';
import { tryParseDhamSarthiJson } from './parseDhamSarthiResponse.js';
import { getCompactHistory, addMessages } from './conversationMemory.js';
import { TOOL_DEFINITIONS, executeTool } from './tools.js';
import { buildStructuredFromToolData } from './toolStructuredFallback.js';
import { normalizeToolCalls, parseMalformedToolCallFromError } from './parseToolCall.js';
import {
  prefetchToolsForMessage,
  formatPrefetchContext,
  prefetchedAsToolMessages,
} from './prefetchTools.js';
import { selectToolDefinitions, requiresLlmForMessage } from './tokenOptimizer.js';
import { detectQueryIntent } from './queryIntent.js';
import {
  buildStructuredFromPrefetch,
  alignResponseToIntent,
  buildGeneralChatFallback,
} from './structuredResponseBuilder.js';
import { rememberDhamFromMessage, resolveDham } from './dhamContext.js';

const MAX_TOOL_ITERATIONS = 2;
const LLM_HISTORY_LIMIT = parseInt(process.env.CHAT_LLM_HISTORY_MESSAGES || '2', 10);

async function executeNormalizedToolCall(toolCall, context) {
  const { name, args } = toolCall.parsed || {};
  console.log(`[DhamSarthi] Tool: ${name}`, args);
  const toolResult = await executeTool(name, args, context);
  return { name, args, toolResult };
}

function appendToolResult(messages, callId, fnName, fnArgs, toolResult) {
  messages.push({
    role: 'assistant',
    content: null,
    tool_calls: [
      {
        id: callId,
        type: 'function',
        function: { name: fnName, arguments: JSON.stringify(fnArgs) },
      },
    ],
  });
  messages.push({
    role: 'tool',
    tool_call_id: callId,
    content: JSON.stringify(toolResult),
  });
}

function buildFromServices(message, prefetched, queryIntent, activeDham) {
  const fromPrefetch = buildStructuredFromPrefetch(message, prefetched, queryIntent, activeDham);
  if (fromPrefetch) return fromPrefetch;

  if (prefetched.length) {
    const fromTools = buildStructuredFromToolData(prefetchedAsToolMessages(prefetched), message);
    if (fromTools) {
      return alignResponseToIntent(fromTools, message, prefetched, activeDham);
    }
  }

  return null;
}

async function runToolGatheringPhase({
  provider,
  message,
  userId,
  userToken,
  history,
  prefetchContext,
}) {
  const context = { userId, userToken };
  const tools = selectToolDefinitions(message, TOOL_DEFINITIONS);
  const systemWithPrefetch = prefetchContext
    ? `${TOOL_GATHERING_SYSTEM}\n\nPre-fetched:\n${prefetchContext}`
    : TOOL_GATHERING_SYSTEM;

  const messages = [
    { role: 'system', content: systemWithPrefetch },
    ...history,
    { role: 'user', content: message.trim() },
  ];

  let iterations = 0;
  let toolCallsMade = Boolean(prefetchContext);
  let lastAssistantText = '';

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations += 1;

    let result;
    try {
      result = await provider.chatCompletion({
        messages,
        tools,
        toolChoice: 'auto',
        maxTokens: 256,
        temperature: 0.3,
      });
    } catch (error) {
      const recovered = parseMalformedToolCallFromError(error.message);
      if (recovered) {
        console.warn('[DhamSarthi] Recovering malformed Groq tool call:', recovered.name);
        const callId = `recovered-${iterations}`;
        const { toolResult } = await executeNormalizedToolCall(
          { parsed: recovered, id: callId },
          context,
        );
        appendToolResult(messages, callId, recovered.name, recovered.args, toolResult);
        toolCallsMade = true;
        continue;
      }

      if (toolCallsMade) {
        console.warn('[DhamSarthi] Tool-phase LLM error, using service data:', error.message);
        break;
      }
      throw error;
    }

    const normalizedCalls = normalizeToolCalls(result.toolCalls);
    if (normalizedCalls.length) {
      toolCallsMade = true;
      messages.push({
        ...result.rawMessage,
        tool_calls: normalizedCalls.map(({ id, type, function: fn }) => ({
          id,
          type,
          function: fn,
        })),
      });

      for (const toolCall of normalizedCalls) {
        const callId = toolCall.id;
        const { toolResult } = await executeNormalizedToolCall(toolCall, context);
        messages.push({
          role: 'tool',
          tool_call_id: callId,
          content: JSON.stringify(toolResult),
        });
      }
      continue;
    }

    if (result.content?.trim()) {
      lastAssistantText = result.content.trim();
      const directJson = tryParseDhamSarthiJson(lastAssistantText);
      if (directJson) {
        return { messages, structured: directJson, toolCallsMade, lastAssistantText };
      }
      messages.push({ role: 'assistant', content: lastAssistantText });
    }

    break;
  }

  return { messages, structured: null, toolCallsMade, lastAssistantText };
}

function structuredFromAssistantText(text, activeDham) {
  if (!text?.trim()) return null;
  const directJson = tryParseDhamSarthiJson(text);
  if (directJson) return directJson;

  return {
    intent: 'general_chat',
    title: 'DhamSarthi AI',
    summary: text.slice(0, 500),
    icon: 'info',
    priority: 'normal',
    data: activeDham ? { dham: activeDham } : {},
    actions: buildGeneralChatFallback('', activeDham).actions,
  };
}

/**
 * Run DhamSarthi AI — prefetch live services first; Groq only for booking / open chat.
 * Zero LLM calls for weather, hotels, crowd, darshan, history, routes (like pre-JSON flow).
 */
export async function runDhamSarthi({ message, userId, userToken, language }) {
  const provider = createProvider();
  const history = getCompactHistory(userId, LLM_HISTORY_LIMIT);
  const context = { userId, userToken };

  rememberDhamFromMessage(message, userId);
  const activeDham = resolveDham(message, userId);
  const queryIntent = detectQueryIntent(message);

  const prefetched = await prefetchToolsForMessage(message, context);
  const prefetchContext = formatPrefetchContext(prefetched);
  if (prefetched.length) {
    console.log(
      `[DhamSarthi] dham=${activeDham || 'none'} intent=${queryIntent} prefetched ${prefetched.length}:`,
      prefetched.map((p) => p.tool).join(', '),
    );
  }

  let structuredResponse = buildFromServices(message, prefetched, queryIntent, activeDham);
  let llmCalls = 0;

  if (structuredResponse) {
    console.log(`[DhamSarthi] No LLM — intent card: ${structuredResponse.intent}`);
  } else if (!requiresLlmForMessage(message)) {
    structuredResponse = buildGeneralChatFallback(message, activeDham);
    console.log('[DhamSarthi] No LLM — general fallback');
  } else {
    console.log('[DhamSarthi] LLM path (booking or open chat)');
    try {
      llmCalls += 1;
      const gatherResult = await runToolGatheringPhase({
        provider,
        message,
        userId,
        userToken,
        history,
        prefetchContext,
      });

      structuredResponse =
        gatherResult.structured ||
        buildStructuredFromToolData(
          [...gatherResult.messages, ...prefetchedAsToolMessages(prefetched)],
          message,
        ) ||
        structuredFromAssistantText(gatherResult.lastAssistantText, activeDham) ||
        buildFromServices(message, prefetched, queryIntent, activeDham) ||
        buildGeneralChatFallback(message, activeDham);
    } catch (error) {
      console.warn('[DhamSarthi] LLM failed, using service data:', error.message);
      structuredResponse =
        buildFromServices(message, prefetched, queryIntent, activeDham) ||
        buildGeneralChatFallback(message, activeDham);
    }
  }

  structuredResponse = alignResponseToIntent(structuredResponse, message, prefetched, activeDham);

  addMessages(userId, [
    { role: 'user', content: message },
    { role: 'assistant', content: structuredResponse.summary },
  ]);

  return {
    reply: structuredResponse.summary,
    structured: structuredResponse,
    intent: structuredResponse.intent,
    source: prefetched.length ? 'dham_sarthi_tools' : llmCalls ? 'dham_sarthi_llm' : 'dham_sarthi',
    language: language || 'en',
  };
}
