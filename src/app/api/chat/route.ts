import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { type Message as AIMessage } from "ai";
import { createSystemPrompt } from "@/utils/ai-context";
import {
	createRecipientTool,
	searchRecipientsTool,
	getUpcomingEventsTool,
	createEventTool,
} from "@/utils/ai-tools";
import { activeToolFlows } from "@/utils/ai-tools/state";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { parseUserMessage } from "@/utils/structured-data-parser";

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
			// Define the tools as an object with named keys
			// The key should match what's referenced in the system prompt
			const tools = {
				createRecipient: createRecipientTool,
				searchRecipients: searchRecipientsTool,
				getUpcomingEvents: getUpcomingEventsTool,
				createEvent: createEventTool,
			};

			// Log the tools for debugging
			console.log("Tools configuration:", Object.keys(tools));
			console.log(
				"Tool details:",
				JSON.stringify(
					{
						createRecipient: tools.createRecipient.description,
						searchRecipients: tools.searchRecipients.description,
						getUpcomingEvents: tools.getUpcomingEvents.description,
						createEvent: tools.createEvent.description,
					},
					null,
					2
				)
			);

			// Get the last user message
			const lastUserMessage = aiMessages
				.filter(
					(message: { role: string; content: string }) =>
						message.role === "user"
				)
				.pop();

			// Check for active tool flows
			let activeFlow = null;
			let activeSessionId = null;

			// Look for the most recent tool invocation to get the session ID
			for (let i = messages.length - 1; i >= 0; i--) {
				const message = messages[i];
				if (
					message.role === "assistant" &&
					message.toolInvocations &&
					message.toolInvocations.length > 0
				) {
					const lastToolInvocation =
						message.toolInvocations[message.toolInvocations.length - 1];
					if (
						lastToolInvocation.result &&
						lastToolInvocation.result.sessionId
					) {
						activeSessionId = lastToolInvocation.result.sessionId;
						console.log("Found active session ID:", activeSessionId);

						// Check if this session is in the activeToolFlows map
						if (activeToolFlows.has(activeSessionId)) {
							activeFlow = activeToolFlows.get(activeSessionId);
							console.log(
								"Found active tool flow:",
								JSON.stringify(activeFlow)
							);
							break;
						}
					}
				}
			}

			// If there's a user message, parse it into structured data
			if (lastUserMessage) {
				// If we have an active flow, add a system message to continue the flow
				if (activeFlow) {
					console.log(
						"Continuing active tool flow:",
						JSON.stringify(activeFlow)
					);

					// Add a system message to guide the AI to continue the flow
					aiMessages.push({
						role: "system",
						content: `The user is in the middle of a ${activeFlow.toolName} flow, currently at step "${activeFlow.currentStep}".
Current data: ${JSON.stringify(activeFlow.data)}
The user's response "${lastUserMessage.content}" is for the current step.
Please continue this flow by calling the appropriate tool with the session ID "${activeSessionId}".`,
					});
				} else {
					// No active flow, parse the message normally
					const parsedData = await parseUserMessage(lastUserMessage.content);

					console.log(
						"Parsed user message:",
						JSON.stringify(parsedData, null, 2)
					);

					// If a tool was identified, prepare to use it
					if (parsedData.toolToUse !== "none" && parsedData.structuredData) {
						// Add a system message with the structured data
						aiMessages.push({
							role: "system",
							content: `The user's message has been analyzed and structured as follows:
Tool to use: ${parsedData.toolToUse}
Reason: ${parsedData.reason}
Structured data: ${JSON.stringify(parsedData.structuredData, null, 2)}

Please use this structured data with the appropriate tool.`,
						});
					}
				}
			}

			try {
				const result = await streamText({
					model: openai("o3-mini"), // Using a more capable model
					system: SYSTEM_PROMPT, // Use the system parameter directly
					messages: aiMessages,
					temperature: 0, // Lower temperature for more deterministic responses
					maxTokens: 2000,
					topP: 0.2, // More focused responses
					frequencyPenalty: 1.0, // Discourage repetition
					presencePenalty: 1.0, // Encourage focusing on provided information
					tools, // Pass the tools object
					maxSteps: 5, // Allow multiple steps for tool usage
					toolCallStreaming: true, // Enable streaming of tool calls for better UI feedback
					onChunk: ({ chunk }) => {
						// If we receive a text-delta chunk (actual text response, not a tool call)
						// We can log that we've received a text response
						if (
							chunk.type === "text-delta" &&
							chunk.textDelta &&
							chunk.textDelta.trim().length > 0
						) {
							console.log(
								"Text response received, tool calls should stop after this step"
							);
						}
					},
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
