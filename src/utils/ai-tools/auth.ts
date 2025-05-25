import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { ToolError } from "./error-handling";

export async function getAuthenticatedConvexClient(): Promise<ConvexHttpClient> {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		throw new ToolError("Convex URL is not configured", "CONFIG_ERROR", false);
	}

	const convex = new ConvexHttpClient(convexUrl);

	// Get the authentication token from Clerk
	const session = await auth();
	const token = await session.getToken({ template: "convex" });

	if (!token) {
		throw new ToolError("Authentication required", "AUTH_REQUIRED");
	}

	// Set the authentication token on the Convex client
	convex.setAuth(token);

	return convex;
}

export function withAuth<T extends unknown[], R>(
	fn: (...args: T) => Promise<R>
) {
	return async (...args: T): Promise<R> => {
		const { userId } = await auth();
		if (!userId) {
			throw new ToolError("Authentication required", "AUTH_REQUIRED");
		}
		return fn(...args);
	};
}
