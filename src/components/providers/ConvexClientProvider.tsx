"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
