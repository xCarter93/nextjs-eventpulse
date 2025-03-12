import { ConvexHttpClient } from "convex/browser";

// Cache the client instance to avoid creating multiple clients
let clientInstance: ConvexHttpClient | null = null;

/**
 * Creates a Convex HTTP client that's compatible with Edge runtime
 * @returns A ConvexHttpClient instance
 */
export function getConvexClient(): ConvexHttpClient {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
	}

	// Return cached instance if available
	if (clientInstance) {
		return clientInstance;
	}

	// Create a new instance and cache it
	clientInstance = new ConvexHttpClient(convexUrl);
	return clientInstance;
}
