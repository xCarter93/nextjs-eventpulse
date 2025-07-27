import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getSubscriptionLevel } from "../src/lib/subscriptions";
import { FREE_TIER_LIMITS } from "../src/lib/subscriptions";
import Stripe from "stripe";
import { getCurrentUserOrNull, getCurrentUser, getUserByTokenIdentifier } from "./lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const DEFAULT_FREE_FEATURES = {
	maxRecipients: 5,
	maxAnimations: 10,
	hasAutoSend: false,
	hasAdvancedTemplates: false,
};

export const createOrUpdate = mutation({
	args: {
		userId: v.string(),
		stripeCustomerId: v.string(),
		stripeSubscriptionId: v.string(),
		stripePriceId: v.string(),
		stripeCurrentPeriodEnd: v.number(),
		stripeCancelAtPeriodEnd: v.boolean(),
	},
	async handler(ctx, args) {
		// Find user in Convex
		const user = await getUserByTokenIdentifier(
			ctx,
			`https://${process.env.CLERK_HOSTNAME}|${args.userId}`
		);

		if (!user) {
			throw new ConvexError("User not found");
		}

		// Find existing subscription
		const existingSubscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		if (existingSubscription) {
			// Update only specific fields for existing subscription
			await ctx.db.patch(existingSubscription._id, {
				stripePriceId: args.stripePriceId,
				stripeCurrentPeriodEnd: args.stripeCurrentPeriodEnd,
				stripeCancelAtPeriodEnd: args.stripeCancelAtPeriodEnd,
			});
		} else {
			// Create new subscription with all fields
			await ctx.db.insert("subscriptions", {
				userId: user._id,
				stripeCustomerId: args.stripeCustomerId,
				stripeSubscriptionId: args.stripeSubscriptionId,
				stripePriceId: args.stripePriceId,
				stripeCurrentPeriodEnd: args.stripeCurrentPeriodEnd,
				stripeCancelAtPeriodEnd: args.stripeCancelAtPeriodEnd,
			});
		}
	},
});

export const deleteSubscription = mutation({
	args: {
		stripeCustomerId: v.string(),
	},
	async handler(ctx, args) {
		// Find and delete existing subscription
		const existingSubscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_stripeCustomerId", (q) =>
				q.eq("stripeCustomerId", args.stripeCustomerId)
			)
			.first();

		if (existingSubscription) {
			await ctx.db.delete(existingSubscription._id);
		}
	},
});

export const getUserSubscriptionLevel = query({
	async handler(ctx) {
		const user = await getCurrentUserOrNull(ctx);

		if (!user) {
			return "free";
		}

		const subscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		return subscription ? "pro" : "free";
	},
});

export const getActiveSubscription = query({
	async handler(ctx) {
		const user = await getCurrentUserOrNull(ctx);

		if (!user) {
			return null;
		}

		const subscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		return subscription;
	},
});

export const isSubscribed = query({
	async handler(ctx) {
		const user = await getCurrentUserOrNull(ctx);

		if (!user) {
			return false;
		}

		const subscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		return subscription
			? !subscription.stripeCancelAtPeriodEnd &&
					subscription.stripeCurrentPeriodEnd > Date.now()
			: false;
	},
});

export const getCheckoutSession = action({
	args: {
		priceId: v.string(),
	},
	async handler(ctx, args) {
		const identity = await ctx.runAction("clerk:getAuth", {});

		if (!identity || !identity.userId) {
			throw new ConvexError("Not authenticated");
		}

		const email = identity.emailAddress;

		// Validate the price ID is from our environment
		const proPriceId = process.env.NEXT_PUBLIC_PRO_PRICE_ID;
		if (args.priceId !== proPriceId) {
			throw new ConvexError("Invalid price ID");
		}

		const domain = process.env.NEXT_PUBLIC_URL!;

		const session = await stripe.checkout.sessions.create({
			line_items: [{ price: args.priceId, quantity: 1 }],
			customer_email: email,
			mode: "subscription",
			success_url: `${domain}/billing/success`,
			cancel_url: `${domain}/billing`,
			metadata: {
				userId: identity.userId,
			},
		});

		return session.url;
	},
});

export const createBillingPortalSession = action({
	async handler(ctx) {
		const user = await ctx.runQuery("subscriptions:getActiveSubscription", {});

		if (!user || !user.stripeCustomerId) {
			throw new ConvexError("No active subscription found");
		}

		const domain = process.env.NEXT_PUBLIC_URL!;

		const session = await stripe.billingPortal.sessions.create({
			customer: user.stripeCustomerId,
			return_url: `${domain}/billing`,
		});

		return session.url;
	},
});

export const cancelSubscription = mutation({
	async handler(ctx) {
		const user = await getCurrentUser(ctx);

		// Get current subscription
		const subscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		if (!subscription) {
			throw new ConvexError("No active subscription found");
		}

		// Cancel the subscription in Stripe
		await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
			cancel_at_period_end: true,
		});

		// Update the subscription in the database
		await ctx.db.patch(subscription._id, {
			stripeCancelAtPeriodEnd: true,
		});

		return subscription;
	},
});

export const getSubscriptionPrice = action({
	args: { priceId: v.string() },
	handler: async (ctx, { priceId }) => {
		return await stripe.prices.retrieve(priceId, { expand: ["product"] });
	},
});
