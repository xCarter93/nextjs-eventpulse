import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getSubscriptionLevel } from "../src/lib/subscriptions";

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
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq(
					"tokenIdentifier",
					`https://${process.env.CLERK_HOSTNAME}|${args.userId}`
				)
			)
			.first();

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
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			return "free";
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			return "free";
		}

		const subscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		return getSubscriptionLevel(subscription);
	},
});
