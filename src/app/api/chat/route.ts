import { openai } from "@ai-sdk/openai";
import {
	streamText,
	ToolExecutionError,
	InvalidToolArgumentsError,
	NoSuchToolError,
} from "ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSystemPrompt } from "@/utils/ai-context";
import { allTools } from "@/utils/ai-tools/simplified-tools-config";
import { logAI, LogLevel, LogCategory, logError } from "@/utils/logging";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

/**
 * Modern chat API route using optimized AI tools
 *
 * Key improvements:
 * - Uses simplified tools instead of complex step-based ones
 * - Leverages AI SDK's native multi-step capabilities with maxSteps
 * - Comprehensive error handling with proper AI SDK error types
 * - Removed custom state management - AI SDK handles conversation flow
 * - Better TypeScript typing and error messages
 */
export async function POST(req: Request) {
	try {
		// Authentication check - required for database operations
		const { userId } = await auth();
		if (!userId) {
			logAI(LogLevel.WARN, LogCategory.AI_CHAT, "unauthenticated_request", {
				endpoint: "/api/chat",
			});

			return NextResponse.json(
				{
					error: "Authentication required",
					details: "You must be signed in to use the chat assistant",
				},
				{ status: 401 }
			);
		}

		// Parse request body with proper error handling
		let body;
		try {
			body = await req.json();
		} catch (parseError) {
			logError(LogCategory.AI_CHAT, "request_parse_error", parseError);
			return NextResponse.json(
				{ error: "Invalid JSON in request body" },
				{ status: 400 }
			);
		}

		const { messages } = body;

		// Validate messages format
		if (!Array.isArray(messages)) {
			logAI(LogLevel.ERROR, LogCategory.AI_CHAT, "invalid_messages_format", {
				messagesType: typeof messages,
				userId,
			});

			return NextResponse.json(
				{ error: "Messages must be an array" },
				{ status: 400 }
			);
		}

		// Log incoming request for debugging
		logAI(LogLevel.INFO, LogCategory.AI_CHAT, "chat_request_received", {
			messageCount: messages.length,
			userId: userId.substring(0, 8) + "...", // Partial user ID for privacy
		});

		// Get the system prompt with EventPulse features documentation
		const systemPrompt = createSystemPrompt();

		try {
			// Stream text with modern AI SDK configuration
			const result = streamText({
				model: openai("gpt-4o"), // Using latest capable model
				system: systemPrompt,
				messages,
				tools: allTools, // Use optimized simplified tools
				maxSteps: 10, // Allow natural multi-step conversations
				temperature: 0.1, // Low temperature for consistent responses
				maxTokens: 2000,

				// Handle streaming errors gracefully
				onError({ error }) {
					logError(LogCategory.AI_CHAT, "stream_error", error, userId);
					console.error("AI Stream Error:", error);
				},
			});

			// Return with comprehensive error handling
			return result.toDataStreamResponse({
				getErrorMessage: (error) => {
					// Log the specific error type for debugging
					logError(LogCategory.AI_CHAT, "response_error", error, userId);

					// Provide user-friendly error messages based on error type
					if (NoSuchToolError.isInstance(error)) {
						return "I tried to use a tool that doesn't exist. Please try again or rephrase your request.";
					} else if (InvalidToolArgumentsError.isInstance(error)) {
						return "I provided invalid arguments to a tool. Please check your input and try again.";
					} else if (ToolExecutionError.isInstance(error)) {
						// Handle specific tool execution errors
						const toolError = error.cause as Error | undefined;

						if (toolError?.message?.includes("authentication")) {
							return "Authentication required. Please log in and try again.";
						} else if (toolError?.message?.includes("date")) {
							return 'Invalid date format. Please provide a valid date (e.g., "March 15, 2025" or "03/15/2025").';
						} else if (toolError?.message?.includes("Convex")) {
							return "Database connection error. Please try again in a moment.";
						}

						return "An error occurred while processing your request. Please try again.";
					} else {
						// Handle any other unknown errors
						return "An unexpected error occurred. Please try again.";
					}
				},
			});
		} catch (streamError) {
			// Handle errors in streamText setup or execution
			logError(LogCategory.AI_CHAT, "streamtext_error", streamError, userId);

			// Check for specific AI SDK errors
			if (NoSuchToolError.isInstance(streamError)) {
				return NextResponse.json(
					{
						error: "Tool configuration error",
						details: "Unknown tool referenced",
					},
					{ status: 500 }
				);
			} else if (InvalidToolArgumentsError.isInstance(streamError)) {
				return NextResponse.json(
					{
						error: "Tool argument error",
						details: "Invalid arguments provided to tool",
					},
					{ status: 400 }
				);
			} else if (ToolExecutionError.isInstance(streamError)) {
				return NextResponse.json(
					{
						error: "Tool execution error",
						details: "Tool failed to execute properly",
					},
					{ status: 500 }
				);
			}

			// Generic error response for unknown stream errors
			return NextResponse.json(
				{
					error: "AI service error",
					details:
						streamError instanceof Error
							? streamError.message
							: "Unknown streaming error",
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		// Handle top-level errors (authentication, parsing, etc.)
		logError(LogCategory.AI_CHAT, "api_route_error", error);

		console.error("Chat API Error:", error);

		return NextResponse.json(
			{
				error: "Internal server error",
				details:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 500 }
		);
	}
}
