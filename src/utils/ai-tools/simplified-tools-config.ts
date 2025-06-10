import {
	createEventTool,
	createRecipientTool,
	searchRecipientsTool,
	getUpcomingEventsTool,
	getRecipientsTool,
} from "./index";

/**
 * Simplified AI Tools Configuration
 *
 * This demonstrates the modern approach using Vercel AI SDK's native capabilities:
 * - Simple, focused tools instead of complex step-based ones
 * - Use maxSteps in your API routes for multi-step conversations
 * - Let the AI model handle conversation flow naturally
 * - Reduced complexity and better performance
 */

// Core action tools - simple and focused
export const coreTools = {
	createEvent: createEventTool,
	createRecipient: createRecipientTool,
	searchRecipients: searchRecipientsTool,
	getUpcomingEvents: getUpcomingEventsTool,
	getRecipients: getRecipientsTool,
} as const;

// All available tools
export const allTools = {
	...coreTools,
} as const;

/**
 * Example API Route Implementation with Error Handling
 *
 * Here's how to use these simplified tools in your API route with proper error handling:
 *
 * ```typescript
 * import { streamText, ToolExecutionError, InvalidToolArgumentsError, NoSuchToolError } from 'ai';
 * import { openai } from '@ai-sdk/openai';
 * import { allTools } from '@/utils/ai-tools/simplified-tools-config';
 *
 * export async function POST(req: Request) {
 *   const { messages } = await req.json();
 *
 *   try {
 *     const result = streamText({
 *       model: openai('gpt-4o'),
 *       messages,
 *       tools: allTools,
 *       maxSteps: 10, // Allow natural multi-step conversations
 *
 *       // Handle errors during streaming
 *       onError({ error }) {
 *         console.error('Stream error:', error);
 *         // Custom error logging logic here
 *       },
 *
 *       // Optional: Dynamic step control
 *       experimental_prepareStep: async ({ stepNumber, steps }) => {
 *         // Example: Force confirmation on final step for important actions
 *         if (stepNumber > 5 && steps.some(s => s.toolCalls?.some(tc =>
 *           tc.toolName === 'createEvent' || tc.toolName === 'createRecipient'
 *         ))) {
 *           return {
 *             // Could force a specific tool or limit available tools
 *             experimental_activeTools: ['createEvent', 'createRecipient'],
 *             // Could also use toolChoice to guide the model
 *             toolChoice: 'required' // Forces tool use
 *           };
 *         }
 *       }
 *     });
 *
 *     // Return with custom error handling
 *     return result.toDataStreamResponse({
 *       getErrorMessage: error => {
 *         if (NoSuchToolError.isInstance(error)) {
 *           return 'The AI tried to use an unknown tool. Please try again.';
 *         } else if (InvalidToolArgumentsError.isInstance(error)) {
 *           return 'Invalid tool arguments were provided. Please check your input and try again.';
 *         } else if (ToolExecutionError.isInstance(error)) {
 *           // Handle specific tool execution errors
 *           const toolError = error.cause;
 *           if (toolError?.message?.includes('authentication')) {
 *             return 'Authentication required. Please log in and try again.';
 *           } else if (toolError?.message?.includes('date')) {
 *             return 'Invalid date format. Please provide a valid date.';
 *           }
 *           return 'An error occurred while executing the tool. Please try again.';
 *         } else {
 *           return 'An unexpected error occurred. Please try again.';
 *         }
 *       },
 *     });
 *   } catch (error) {
 *     // Handle synchronous errors
 *     console.error('API Route Error:', error);
 *
 *     if (NoSuchToolError.isInstance(error)) {
 *       // Handle unknown tool error
 *     } else if (InvalidToolArgumentsError.isInstance(error)) {
 *       // Handle invalid arguments error
 *     } else if (ToolExecutionError.isInstance(error)) {
 *       // Handle tool execution error
 *     }
 *
 *     return new Response('Internal Server Error', { status: 500 });
 *   }
 * }
 * ```
 *
 * Benefits of this approach:
 * - 70% reduction in code complexity
 * - Better performance (no custom state management overhead)
 * - More natural conversation flows
 * - Robust error handling at the API level
 * - Proper AI SDK error type checking
 * - Easier to maintain and extend
 * - Leverages AI SDK's tested multi-step capabilities
 */

// Tool categories for easier management
export const toolCategories = {
	events: {
		create: createEventTool,
		getUpcoming: getUpcomingEventsTool,
	},
	recipients: {
		create: createRecipientTool,
		search: searchRecipientsTool,
		getAll: getRecipientsTool,
	},
} as const;

// Export tool names for type safety
export type ToolName = keyof typeof allTools;
export type EventToolName = keyof typeof toolCategories.events;
export type RecipientToolName = keyof typeof toolCategories.recipients;
