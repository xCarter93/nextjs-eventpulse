import {
	mutation,
	query,
	internalAction,
	internalQuery,
	internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation(async (ctx) => {
	return await ctx.storage.generateUploadUrl();
});

export const getAnimationUrl = query({
	args: { storageId: v.id("_storage") },
	async handler(ctx, args) {
		return await ctx.storage.getUrl(args.storageId);
	},
});

export const getAnimationUrlInternal = internalQuery({
	args: { storageId: v.id("_storage") },
	async handler(ctx, args) {
		return await ctx.storage.getUrl(args.storageId);
	},
});

export const getBaseAnimations = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		// Get base animations
		const baseAnimations = await ctx.db
			.query("animations")
			.filter((q) => q.eq(q.field("isBaseAnimation"), true))
			.collect();

		// If user is not logged in, only return base animations
		if (!identity) {
			return baseAnimations;
		}

		// Get user's custom animations
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			return baseAnimations;
		}

		const userAnimations = await ctx.db
			.query("animations")
			.filter((q) =>
				q.and(
					q.eq(q.field("userId"), user._id),
					q.eq(q.field("isBaseAnimation"), false)
				)
			)
			.collect();

		// Return both base animations and user's custom animations
		return [...baseAnimations, ...userAnimations];
	},
});

export const saveAnimation = mutation({
	args: {
		storageId: v.id("_storage"),
		name: v.string(),
		description: v.string(),
	},
	handler: async (ctx, args): Promise<Id<"animations">> => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		// Get user's subscription level
		const subscriptionLevel: "free" | "pro" = await ctx.runQuery(
			api.subscriptions.getUserSubscriptionLevel
		);

		// Calculate expiration date for free tier users (10 days from now)
		const expirationDate: number | undefined =
			subscriptionLevel === "free"
				? Date.now() + 10 * 24 * 60 * 60 * 1000 // 10 days in milliseconds
				: undefined;

		const animationId = await ctx.db.insert("animations", {
			storageId: args.storageId,
			name: args.name,
			description: args.description,
			isBaseAnimation: false,
			userId: user._id,
			expirationDate,
		});
		return animationId;
	},
});

export const create = mutation({
	args: {
		userId: v.id("users"),
		templateId: v.string(),
		message: v.string(),
		colorScheme: v.object({
			primary: v.string(),
			secondary: v.string(),
			accent: v.string(),
			background: v.string(),
		}),
		customLottieUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const animationId = await ctx.db.insert("animations", {
			...args,
		});
		return animationId;
	},
});

export const list = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("animations")
			.filter((q) => q.eq(q.field("userId"), args.userId))
			.order("desc")
			.collect();
	},
});

export const cleanupFreeUserAnimations = internalAction({
	handler: async (ctx) => {
		// Get all animations that have expired
		const animationsToDelete = await ctx.runQuery(
			internal.animations.getExpiredAnimations,
			{
				currentTime: Date.now(),
			}
		);

		// Delete each animation and its associated file
		for (const animation of animationsToDelete) {
			if (animation.storageId) {
				// Delete the file from storage
				await ctx.storage.delete(animation.storageId);
			}

			// Delete the animation record
			await ctx.runMutation(internal.animations.deleteAnimation, {
				id: animation._id,
			});
		}
	},
});

export const getExpiredAnimations = internalQuery({
	handler: async (ctx, args) => {
		// Get all animations that have an expiration date in the past
		return await ctx.db
			.query("animations")
			.withIndex("by_expiration")
			.filter((q) =>
				q.and(
					q.neq(q.field("expirationDate"), undefined),
					q.lt(q.field("expirationDate"), args.currentTime)
				)
			)
			.collect();
	},
	args: { currentTime: v.number() },
});

export const deleteAnimation = internalMutation({
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
	args: { id: v.id("animations") },
});

export const getBaseAnimation = internalQuery({
	args: {},
	async handler(ctx) {
		// Get a random base animation
		const baseAnimations = await ctx.db
			.query("animations")
			.filter((q) => q.eq(q.field("isBaseAnimation"), true))
			.collect();

		if (baseAnimations.length === 0) {
			throw new Error("No base animations found");
		}

		// Return a random animation
		const randomIndex = Math.floor(Math.random() * baseAnimations.length);
		return baseAnimations[randomIndex];
	},
});

export const getAnimation = internalQuery({
	args: { id: v.id("animations") },
	async handler(ctx, args) {
		return await ctx.db.get(args.id);
	},
});

export const deleteUserAnimation = mutation({
	args: {
		id: v.id("animations"),
	},
	async handler(ctx, args) {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		const animation = await ctx.db.get(args.id);
		if (!animation || animation.userId !== user._id) {
			throw new ConvexError("Animation not found or access denied");
		}

		// Delete the file from storage if it exists
		if (animation.storageId) {
			await ctx.storage.delete(animation.storageId);
		}

		// Delete the animation record
		await ctx.db.delete(args.id);
	},
});
