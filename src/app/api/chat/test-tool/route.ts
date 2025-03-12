import { NextRequest, NextResponse } from "next/server";
import { createRecipientTool } from "@/utils/ai-tools";
import { auth } from "@clerk/nextjs/server";

// Configure the runtime for Edge compatibility
export const runtime = "edge";

/**
 * Test endpoint to verify that the createRecipientTool is working correctly
 * This can be called directly to test the tool without going through the chat interface
 */
export async function GET(req: NextRequest) {
	try {
		// Check authentication
		const authResult = await auth();
		const userId = authResult.userId;
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get URL parameters
		const url = new URL(req.url);
		const step = url.searchParams.get("step");
		const name = url.searchParams.get("name") || "";
		const email = url.searchParams.get("email") || "";
		const birthday = url.searchParams.get("birthday") || "";

		// Validate step parameter
		if (!step) {
			return NextResponse.json(
				{ error: "Missing required parameter: step" },
				{ status: 400 }
			);
		}

		// Execute the tool with the provided parameters
		// @ts-expect-error - Bypassing TypeScript checking for testing purposes
		const result = await createRecipientTool.execute({
			step,
			name,
			email,
			birthday,
		});

		// Return the result
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in test-tool route:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 500 }
		);
	}
}
