import { NextResponse } from "next/server";
import { createRecipientTool } from "@/utils/ai-tools";
import { auth } from "@clerk/nextjs/server";

// Configure the runtime for Edge compatibility
export const runtime = "edge";

// Define the valid steps for the tool
type RecipientStep =
	| "start"
	| "collect-name"
	| "collect-email"
	| "collect-birthday"
	| "confirm"
	| "submit";

/**
 * Test endpoint to verify that the createRecipientTool is working correctly
 * This can be called directly to test the tool without going through the chat interface
 */
export async function GET(req: Request) {
	try {
		// Check authentication - needed for database operations
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json(
				{
					success: false,
					error: "Authentication required",
				},
				{ status: 401 }
			);
		}

		// Get the URL parameters
		const url = new URL(req.url);
		const stepParam = url.searchParams.get("step") || "start";
		const name = url.searchParams.get("name") || "";
		const email = url.searchParams.get("email") || "";
		const birthday = url.searchParams.get("birthday") || "";

		// Validate the step parameter
		const step = validateStep(stepParam);

		console.log("Testing createRecipientTool with parameters:", {
			step,
			name,
			email,
			birthday,
		});

		try {
			// Execute the tool directly
			// @ts-expect-error - We're bypassing the type checking for testing purposes
			const result = await createRecipientTool.execute({
				step,
				name,
				email,
				birthday,
			});

			// Return the result
			return NextResponse.json({
				success: true,
				result,
			});
		} catch (toolError) {
			console.error("Error executing tool:", toolError);
			return NextResponse.json(
				{
					success: false,
					error:
						toolError instanceof Error ? toolError.message : String(toolError),
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error testing createRecipientTool:", error);
		if (error instanceof Error) {
			console.error("Error name:", error.name);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);

			return NextResponse.json(
				{
					success: false,
					error: {
						name: error.name,
						message: error.message,
						stack: error.stack,
					},
				},
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{
				success: false,
				error: String(error),
			},
			{ status: 500 }
		);
	}
}

/**
 * Validates that the step parameter is one of the valid steps
 * @param step The step parameter to validate
 * @returns The validated step
 * @throws Error if the step is invalid
 */
function validateStep(step: string): RecipientStep {
	const validSteps: RecipientStep[] = [
		"start",
		"collect-name",
		"collect-email",
		"collect-birthday",
		"confirm",
		"submit",
	];

	if (validSteps.includes(step as RecipientStep)) {
		return step as RecipientStep;
	}

	throw new Error(
		`Invalid step: ${step}. Valid steps are: ${validSteps.join(", ")}`
	);
}
