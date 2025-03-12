// Import only what's needed for the server-side function
// This avoids importing React-dependent code in Edge functions
import { api } from "../../convex/_generated/api";
import type { ConvexHttpClient } from "convex/browser";

// Client-side imports (only used in browser)
// These won't be included in Edge runtime code
import { useMutation } from "convex/react";

/**
 * Hook to add a new recipient (CLIENT-SIDE ONLY)
 * @returns A function to add a new recipient
 */
export function useAddRecipient() {
	const addRecipientMutation = useMutation(api.recipients.addRecipient);

	/**
	 * Add a new recipient
	 * @param name - The recipient's name
	 * @param email - The recipient's email
	 * @param birthday - The recipient's birthday as a timestamp
	 * @returns The ID of the newly created recipient
	 */
	const addRecipient = async ({
		name,
		email,
		birthday,
	}: {
		name: string;
		email: string;
		birthday: number;
	}) => {
		try {
			const recipientId = await addRecipientMutation({
				name,
				email,
				birthday,
			});

			return {
				success: true,
				recipientId,
			};
		} catch (error) {
			console.error("Error adding recipient:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	};

	return addRecipient;
}

/**
 * Function to create a new recipient (SERVER-SIDE ONLY)
 * This is a wrapper around the Convex mutation for use in AI tools
 * Compatible with Edge runtime
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
		// Use the mutation method of the ConvexHttpClient
		// This is Edge-compatible and doesn't rely on React context
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
