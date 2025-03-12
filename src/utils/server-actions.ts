import { api } from "../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

/**
 * Function to create a new recipient (server-side)
 * This is a wrapper around the Convex mutation for use in AI tools
 * @param client - The Convex client
 * @param name - The recipient's name
 * @param email - The recipient's email
 * @param birthday - The recipient's birthday as a timestamp
 * @returns The result of the mutation
 */
export async function createRecipient(
	client: ConvexHttpClient,
	{
		name,
		email,
		birthday,
	}: {
		name: string;
		email: string;
		birthday: number;
	}
) {
	try {
		// Get the authentication token from Clerk
		const session = await auth();
		const token = await session.getToken({ template: "convex" });

		if (!token) {
			console.error("Failed to get authentication token from Clerk");
			return {
				success: false,
				error: "Authentication failed. Please make sure you're logged in.",
			};
		}

		console.log("Got authentication token from Clerk");

		// Set the authentication token on the Convex client
		client.setAuth(token);

		console.log("Calling Convex mutation with data:", {
			name,
			email,
			birthday,
		});
		const result = await client.mutation(api.recipients.addRecipient, {
			name,
			email,
			birthday,
		});

		console.log("Mutation result:", result);
		return {
			success: true,
			recipientId: result,
		};
	} catch (error) {
		console.error("Error creating recipient:", error);
		let errorMessage = "Unknown error";

		if (error instanceof Error) {
			errorMessage = error.message;
			console.error("Error name:", error.name);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);

			// Check for authentication errors
			if (
				error.message.includes("Not authenticated") ||
				error.message.includes("authentication") ||
				error.message.includes("auth")
			) {
				errorMessage =
					"Authentication failed. Please make sure you're logged in and have the necessary permissions.";
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
}
