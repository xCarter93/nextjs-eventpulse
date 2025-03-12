"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";

// Initialize Convex directly with environment variables
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
if (!convexUrl) {
	console.warn("NEXT_PUBLIC_CONVEX_URL is not configured");
}

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
			<Authenticated>{children}</Authenticated>
			<Unauthenticated>{children}</Unauthenticated>
		</ConvexProviderWithClerk>
	);
}

// Export the client for use in prefetching
export { convex };
