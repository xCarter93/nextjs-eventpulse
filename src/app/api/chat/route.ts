import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mastra } from "@/mastra";
import { logAI, LogLevel, LogCategory, logError } from "@/utils/logging";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

/**
 * Modern chat API route using Mastra orchestrator agent
 *
 * Key improvements:
 * - Uses Mastra orchestrator agent for intelligent task delegation
 * - Specialized agents handle specific domains (events, contacts)
 * - Multi-step reasoning with conversation memory
 * - Comprehensive error handling
 * - Better agent coordination and context management
 * - Proper Vercel AI SDK integration with .toDataStreamResponse()
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

		const { messages, threadId } = body;

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
			hasThreadId: !!threadId,
		});

		try {
			// Get the orchestrator agent from Mastra
			const orchestrator = mastra.getAgent("orchestratorAgent");

			if (!orchestrator) {
				logAI(LogLevel.ERROR, LogCategory.AI_CHAT, "orchestrator_not_found", {
					userId,
				});
				throw new Error("Orchestrator agent not available");
			}

			// Stream response using Mastra agent with memory support
			const stream = await orchestrator.stream(messages, {
				memory: {
					thread: threadId || crypto.randomUUID(),
					resource: userId, // Use user ID as resource identifier
				},
				maxSteps: 10, // Allow multi-step reasoning
				temperature: 0.1, // Low temperature for consistent responses
				onStepFinish: ({ text, toolCalls, toolResults }) => {
					// Log step completion for debugging
					logAI(LogLevel.DEBUG, LogCategory.AI_CHAT, "step_completed", {
						userId: userId.substring(0, 8) + "...",
						hasText: !!text,
						toolCallsCount: toolCalls?.length || 0,
						toolResultsCount: toolResults?.length || 0,
					});
				},
			});

			// Return the stream as a properly formatted DataStreamResponse for Vercel AI SDK
			// This is the correct way to integrate Mastra agents with useChat hook
			return stream.toDataStreamResponse();
		} catch (streamError) {
			// Handle errors in agent execution
			logError(LogCategory.AI_CHAT, "agent_stream_error", streamError, userId);

			console.error("Mastra Agent Error:", streamError);

			// Provide user-friendly error messages
			const errorMessage =
				streamError instanceof Error ? streamError.message : "Unknown error";

			if (errorMessage.includes("authentication")) {
				return NextResponse.json(
					{
						error: "Authentication error",
						details: "Please log in and try again",
					},
					{ status: 401 }
				);
			} else if (errorMessage.includes("agent not found")) {
				return NextResponse.json(
					{
						error: "Service configuration error",
						details: "AI agent not available",
					},
					{ status: 500 }
				);
			} else if (errorMessage.includes("tool")) {
				return NextResponse.json(
					{
						error: "Tool execution error",
						details: "An error occurred while processing your request",
					},
					{ status: 500 }
				);
			}

			// Generic error response
			return NextResponse.json(
				{
					error: "AI service error",
					details: errorMessage,
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
