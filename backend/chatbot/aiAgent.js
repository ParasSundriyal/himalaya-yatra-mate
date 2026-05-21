import { createProvider } from './llmProvider.js';
import { TOOL_DEFINITIONS, executeTool } from './tools.js';
import { getHistory, addMessages } from './conversationMemory.js';

const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are "Yatra Buddy", the official AI assistant for Himalaya Yatra Mate — a Chardham pilgrimage management platform.

You help users with:
- Parking availability, booking, and viewing their parking bookings
- Hotel search, booking, and viewing their hotel bookings
- Taxi availability, booking, and viewing their taxi bookings
- Hourly checkpoint passes: slot availability, booking, and viewing their passes
- Live crowd status at the four Dhams (Yamunotri, Gangotri, Kedarnath, Badrinath)
- Crowd predictions for future dates
- Dham opening/closing status and itinerary info
- Nearby attractions around each Dham
- Live dashboard data (weather, crowd, passes issued)

RULES:
1. Always use the appropriate tool to fetch real data before answering.
2. Summarize API responses in a friendly, concise way.
3. Include specific numbers (prices, availability counts, temperatures).
4. If the Dham name is mentioned, normalize it to lowercase: yamunotri, gangotri, kedarnath, badrinath.
5. For dates, use YYYY-MM-DD format.
6. If the question is generic (history, culture, travel tips, etc.) and no tool fits, use the web_search tool.
7. Reply in the same language the user writes in (Hindi or English).
8. Keep replies under 200 words.
9. For booking actions (book_parking, book_hotel, book_taxi, book_hourly_pass), ALWAYS confirm details with the user FIRST before calling the booking tool. List what you are about to book and ask "Shall I proceed?". Only call the booking tool after the user confirms.
10. When showing bookings, format them nicely with booking ID, status, dates, and amounts.
11. If user is not logged in and tries booking or viewing bookings, politely tell them to log in first.
12. Be warm, helpful, and use relevant emojis sparingly (🏔️ 🛕 🚗 🅿️ 🏨).`;

/**
 * Run the AI agent loop for a single user message.
 *
 * @param {Object} params
 * @param {string} params.message    - User's message text
 * @param {string} params.userId     - User ID (for memory + auth)
 * @param {string} params.userToken  - JWT token (for auth context)
 * @param {string} params.language   - 'en' | 'hi'
 * @returns {Promise<{reply: string, intent: string, source: string}>}
 */
export async function runAgent({ message, userId, userToken, language }) {
  const provider = createProvider();
  const context = { userId, userToken };

  // Build messages array
  const history = getHistory(userId);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: message },
  ];

  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const result = await provider.chatCompletion({
      messages,
      tools: TOOL_DEFINITIONS,
      toolChoice: 'auto',
      maxTokens: 1024,
      temperature: 0.7,
    });

    // If the model returns a text response (no tool calls), we're done
    if (result.content && (!result.toolCalls || result.toolCalls.length === 0)) {
      // Save to conversation memory
      addMessages(userId, [
        { role: 'user', content: message },
        { role: 'assistant', content: result.content },
      ]);

      return {
        reply: result.content,
        intent: 'ai_agent',
        source: 'coded_agent',
      };
    }

    // If the model wants to call tools, execute them
    if (result.toolCalls && result.toolCalls.length > 0) {
      // Append the assistant message with tool_calls to the conversation
      messages.push(result.rawMessage);

      // Execute each tool call
      for (const toolCall of result.toolCalls) {
        const fnName = toolCall.function.name;
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          fnArgs = {};
        }

        console.log(`[Agent] Calling tool: ${fnName}`, fnArgs);

        const toolResult = await executeTool(fnName, fnArgs, context);

        // Append the tool result as a message
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Continue the loop — the model will see the tool results and respond
      continue;
    }

    // Edge case: no content and no tool calls (shouldn't happen)
    break;
  }

  // Fallback if we hit max iterations
  return {
    reply: 'I apologize, I had trouble processing your request. Could you please try rephrasing your question?',
    intent: 'ai_agent',
    source: 'coded_agent',
  };
}
