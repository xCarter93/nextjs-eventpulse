import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { type Message as AIMessage } from "ai";
import { createSystemPrompt } from "@/utils/ai-context";
import { tools } from "@/utils/ai-tools/tools";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
	try {
		// Check authentication - needed for database operations
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json(
				{
					error: "Authentication required",
					details: "You must be signed in to use the chat assistant",
				},
				{ status: 401 }
			);
		}

		const { messages } = await req.json();

		// Log the incoming messages to debug
		console.log("Incoming messages:", JSON.stringify(messages));

		// Convert client messages to the format expected by the AI SDK
		const aiMessages = messages.map((message: AIMessage) => ({
			role: message.role,
			content: message.content,
		}));

		// Get the system prompt with the latest EventPulse features documentation
		const SYSTEM_PROMPT = createSystemPrompt();

		try {
			// Log the tools for debugging
			console.log("Tools configuration:", Object.keys(tools));
			console.log(
				"Tool details:",
				JSON.stringify(
					{
						createEvent: tools.createEvent.description,
						createRecipient: tools.createRecipient.description,
						searchEvents: tools.searchEvents.description,
						searchRecipients: tools.searchRecipients.description,
					},
					null,
					2
				)
			);

			try {
				const result = await streamText({
					model: openai("o3-mini"),
					system: SYSTEM_PROMPT,
					messages: aiMessages,
					temperature: 0.1, // Lower temperature for more deterministic responses
					maxTokens: 2000,
					tools, // Use the consolidated tools
					maxSteps: 5, // Allow multiple tool steps
					toolCallStreaming: true, // Enable streaming of tool calls
				});

				// Add error handling to the data stream response
				return result.toDataStreamResponse({
					getErrorMessage: (error) => {
						console.error("Stream error:", error);
						if (error instanceof Error) {
							return `Error: ${error.name} - ${error.message}`;
						}
						return `Error: ${String(error)}`;
					},
				});
			} catch (streamError) {
				// Log the full error details for debugging
				console.error("Error in streamText execution:", streamError);
				if (streamError instanceof Error) {
					console.error("Stream error name:", streamError.name);
					console.error("Stream error message:", streamError.message);
					console.error("Stream error stack:", streamError.stack);

					return NextResponse.json(
						{
							error: "Stream error",
							details: {
								name: streamError.name,
								message: streamError.message,
								stack: streamError.stack,
							},
						},
						{ status: 500 }
					);
				}

				return NextResponse.json(
					{ error: "Unknown stream error", details: String(streamError) },
					{ status: 500 }
				);
			}
		} catch (error) {
			// Log the full error details for debugging
			console.error("Error in streamText setup:", error);
			if (error instanceof Error) {
				console.error("Error name:", error.name);
				console.error("Error message:", error.message);
				console.error("Error stack:", error.stack);

				return NextResponse.json(
					{
						error: "Setup error",
						details: {
							name: error.name,
							message: error.message,
							stack: error.stack,
						},
					},
					{ status: 500 }
				);
			}

			return NextResponse.json(
				{ error: "Unknown setup error", details: String(error) },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in POST handler:", error);
		if (error instanceof Error) {
			console.error("Error name:", error.name);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);

			return NextResponse.json(
				{
					error: "Request error",
					details: {
						name: error.name,
						message: error.message,
						stack: error.stack,
					},
				},
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: "Unknown request error", details: String(error) },
			{ status: 500 }
		);
	}
}
