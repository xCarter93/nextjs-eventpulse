import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { createClerkClient } from "@clerk/nextjs/server";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function POST(req: Request) {
	try {
		const { subscriptionId } = await req.json();

		if (!subscriptionId) {
			return new NextResponse("Subscription ID is required", { status: 400 });
		}

		// Get the subscription to find the customer
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);

		// Cancel the subscription immediately
		await stripe.subscriptions.cancel(subscriptionId);

		// Get user ID from subscription metadata
		const userId = subscription.metadata.userId;
		if (userId) {
			// Clear stripeCustomerId from Clerk metadata
			await clerk.users.updateUser(userId, {
				privateMetadata: {
					stripeCustomerId: null,
				},
			});
		}

		return new NextResponse(null, { status: 200 });
	} catch (error) {
		console.error("Error cancelling subscription:", error);
		return new NextResponse(
			"An error occurred while cancelling the subscription",
			{ status: 500 }
		);
	}
}
