import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export const runtime = "edge";

// Initialize Stripe directly with environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
	apiVersion: "2024-12-18.acacia", // Use the latest API version
});

// Initialize Convex client
const getConvexClient = () => {
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
	if (!convexUrl) {
		throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
	}
	return new ConvexHttpClient(convexUrl);
};

export async function POST(req: NextRequest) {
	try {
		const payload = await req.text();
		const signature = req.headers.get("stripe-signature");

		if (!signature) {
			return NextResponse.json(
				{ error: "Webhook signature is missing" },
				{ status: 400 }
			);
		}

		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
		if (!webhookSecret) {
			throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
		}

		const event = stripe.webhooks.constructEvent(
			payload,
			signature,
			webhookSecret
		);

		console.log(`Webhook received: ${event.type}`);

		switch (event.type) {
			case "checkout.session.completed":
				await handleSessionCompleted(event.data.object);
				break;
			case "customer.subscription.created":
			case "customer.subscription.updated":
				await handleSubscriptionCreatedOrUpdated(event.data.object.id);
				break;
			case "customer.subscription.deleted":
				await handleSubscriptionDeleted(event.data.object);
				break;
			default:
				console.log(`Unhandled event type: ${event.type}`);
				break;
		}

		return NextResponse.json({ received: true }, { status: 200 });
	} catch (error) {
		console.error("Webhook error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

async function handleSessionCompleted(session: Stripe.Checkout.Session) {
	const userId = session.metadata?.userId;

	if (!userId) {
		throw new Error("User ID is missing in session metadata");
	}

	const clerk = await clerkClient();
	await clerk.users.updateUserMetadata(userId, {
		privateMetadata: {
			stripeCustomerId: session.customer as string,
		},
	});
}

async function handleSubscriptionCreatedOrUpdated(subscriptionId: string) {
	const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
		expand: ["items.data.price"],
	});

	if (
		subscription.status === "active" ||
		subscription.status === "trialing" ||
		subscription.status === "past_due"
	) {
		if (!subscription.metadata.userId) {
			throw new Error("User ID is missing in subscription metadata");
		}

		const userId = subscription.metadata.userId;
		const price = subscription.items.data[0].price;
		const convexClient = getConvexClient();

		// Create or update subscription in Convex
		await convexClient.mutation(api.subscriptions.createOrUpdate, {
			userId,
			stripeCustomerId: subscription.customer as string,
			stripeSubscriptionId: subscription.id,
			stripePriceId: price.id,
			stripeCurrentPeriodEnd: subscription.current_period_end * 1000, // Convert to milliseconds
			stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
		});
	} else {
		// Delete subscription if status is not active/trialing/past_due
		const convexClient = getConvexClient();
		await convexClient.mutation(api.subscriptions.deleteSubscription, {
			stripeCustomerId: subscription.customer as string,
		});
	}
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	// Delete subscription from Convex
	const convexClient = getConvexClient();
	await convexClient.mutation(api.subscriptions.deleteSubscription, {
		stripeCustomerId: subscription.customer as string,
	});
}
