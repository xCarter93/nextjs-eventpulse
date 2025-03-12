import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { type Message as AIMessage } from "ai";
import { createSystemPrompt } from "@/utils/ai-context";
import { createRecipientTool } from "@/utils/ai-tools";
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
	try {
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
			// Define the tools object
			const tools = {
				createRecipient: createRecipientTool,
			};

			// Log the tools for debugging
			console.log("Tools configuration:", Object.keys(tools));

			const result = await streamText({
				model: openai("o3-mini"), // Using a more capable model
				system: SYSTEM_PROMPT, // Use the system parameter directly
				messages: aiMessages,
				temperature: 0, // Lower temperature for more deterministic responses
				maxTokens: 1000,
				topP: 0.2, // More focused responses
				frequencyPenalty: 1.0, // Discourage repetition
				presencePenalty: 1.0, // Encourage focusing on provided information
				tools, // Add our tools here
			});

			return result.toDataStreamResponse();
		} catch (error) {
			console.error("Error in streamText:", error);
			return NextResponse.json(
				{ error: "An error occurred while processing your request" },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in POST handler:", error);
		return NextResponse.json(
			{ error: "An error occurred while processing your request" },
			{ status: 500 }
		);
	}
}
