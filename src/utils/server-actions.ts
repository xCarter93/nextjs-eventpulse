import { api } from "../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

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
		const result = await client.mutation(api.recipients.addRecipient, {
			name,
			email,
			birthday,
		});

		return {
			success: true,
			recipientId: result,
		};
	} catch (error) {
		console.error("Error creating recipient:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
