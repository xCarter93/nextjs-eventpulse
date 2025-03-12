/**
 * This file contains Edge-compatible Convex utilities
 * It avoids importing any React hooks or components
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Cache the client instance to avoid creating multiple clients
let clientInstance: ConvexHttpClient | null = null;

/**
 * Creates a Convex HTTP client that's compatible with Edge runtime
 * @param convexUrl The Convex URL from environment variables
 * @returns A ConvexHttpClient instance
 */
export function getEdgeConvexClient(convexUrl: string): ConvexHttpClient {
	if (!convexUrl) {
		throw new Error("Convex URL is not configured");
	}

	// Return cached instance if available
	if (clientInstance) {
		return clientInstance;
	}

	// Create a new instance and cache it
	clientInstance = new ConvexHttpClient(convexUrl);
	return clientInstance;
}

/**
 * Add a recipient using the Edge-compatible Convex client
 * This function is specifically designed for Edge runtime
 */
export async function addRecipientEdge(
	convexUrl: string,
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
		const client = getEdgeConvexClient(convexUrl);

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
		console.error("Error adding recipient in Edge runtime:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
