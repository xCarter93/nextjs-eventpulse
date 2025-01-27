import { env } from "@/env";
import stripe from "@/lib/stripe";
import { createClerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req: NextRequest) {
	try {
		const payload = await req.text();
		const signature = req.headers.get("stripe-signature");

		if (!signature) {
			return new Response("Webhook signature is missing", { status: 400 });
		}

		const event = stripe.webhooks.constructEvent(
			payload,
			signature,
			env.STRIPE_WEBHOOK_SECRET
		);

		console.log(`Webhook received: ${event.type}`, event.data.object);

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

		return new Response("Webhook received", { status: 200 });
	} catch (error) {
		console.error(error);
		return new Response("Webhook error", { status: 500 });
	}
}

async function handleSessionCompleted(session: Stripe.Checkout.Session) {
	const userId = session.metadata?.userId;

	if (!userId) {
		throw new Error("User ID is missing in session metadata");
	}

	await clerk.users.updateUser(userId, {
		privateMetadata: {
			stripeCustomerId: session.customer as string,
		},
	});
}

async function handleSubscriptionCreatedOrUpdated(subscriptionId: string) {
	const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
		expand: ["items.data.price"],
	});

	console.log("Customer type:", typeof subscription.customer);
	console.log("Customer value:", subscription.customer);

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

		// Create or update subscription in Convex
		await convex.mutation(api.subscriptions.createOrUpdate, {
			userId,
			stripeCustomerId: subscription.customer as string,
			stripeSubscriptionId: subscription.id,
			stripePriceId: price.id,
			stripeCurrentPeriodEnd: subscription.current_period_end * 1000, // Convert to milliseconds
			stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
		});
	} else {
		// Delete subscription if status is not active/trialing/past_due
		await convex.mutation(api.subscriptions.deleteSubscription, {
			stripeCustomerId: subscription.customer as string,
		});
	}
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	// Delete subscription from Convex
	await convex.mutation(api.subscriptions.deleteSubscription, {
		stripeCustomerId: subscription.customer as string,
	});
}
