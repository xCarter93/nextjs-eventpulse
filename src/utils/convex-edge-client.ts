import { ConvexHttpClient } from "convex/browser";

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

	return new ConvexHttpClient(convexUrl);
}
