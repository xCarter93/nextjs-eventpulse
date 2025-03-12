import { ConvexHttpClient } from "convex/browser";

// Cache the client instance to avoid creating multiple clients
let clientInstance: ConvexHttpClient | null = null;

/**
 * Creates a Convex HTTP client that's compatible with Edge runtime
 * This avoids the React dependency issues in the Edge runtime
 * @param convexUrl The Convex URL from environment variables
 * @returns A ConvexHttpClient instance
 */
export function createEdgeConvexClient(convexUrl: string): ConvexHttpClient {
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
