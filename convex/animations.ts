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
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";
import { INDEX_NAMES, DB_ERRORS, checkSubscriptionLimit } from "./lib/database";

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

export const getUserAnimations = query({
	handler: async (ctx) => {
		const user = await getCurrentUserOrNull(ctx);

		// If user is not logged in, only return base animations
		if (!user) {
			return [];
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

		// Get URLs for user animations
		return await Promise.all(
			userAnimations.map(async (animation) => ({
				...animation,
				url: animation.storageId
					? await ctx.storage.getUrl(animation.storageId)
					: undefined,
			}))
		);
	},
});

export const saveAnimation = mutation({
	args: {
		storageId: v.id("_storage"),
		name: v.string(),
		description: v.string(),
	},
	handler: async (ctx, args): Promise<Id<"animations">> => {
		const user = await getCurrentUser(ctx);

		// Get current animation count and check subscription limits
		const userAnimations = await ctx.db
			.query("animations")
			.filter((q) =>
				q.and(
					q.eq(q.field("userId"), user._id),
					q.eq(q.field("isBaseAnimation"), false)
				)
			)
			.collect();

		await checkSubscriptionLimit(ctx, user._id, "animations", userAnimations.length);

		// Set expiration for free users (30 days from now)
		const subscriptionLevel = await ctx.runQuery(
			api.subscriptions.getUserSubscriptionLevel
		);
		const expirationDate = subscriptionLevel === "free" 
			? Date.now() + 30 * 24 * 60 * 60 * 1000 
			: undefined;

		return await ctx.db.insert("animations", {
			userId: user._id,
			storageId: args.storageId,
			name: args.name,
			description: args.description,
			isBaseAnimation: false,
			expirationDate,
		});
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

export const deleteAnimation = mutation({
	args: {
		id: v.id("animations"),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		const animation = await ctx.db.get(args.id);
		if (!animation || animation.userId !== user._id) {
			throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
		}

		// Don't allow deletion of base animations
		if (animation.isBaseAnimation) {
			throw new ConvexError("Cannot delete base animations");
		}

		// Delete the storage file if it exists
		if (animation.storageId) {
			await ctx.storage.delete(animation.storageId);
		}

		// Delete the database record
		await ctx.db.delete(args.id);
	},
});

// Get base animations (available to all users)
export const getBaseAnimations = query({
	handler: async (ctx) => {
		const baseAnimations = await ctx.db
			.query("animations")
			.filter((q) => q.eq(q.field("isBaseAnimation"), true))
			.collect();

		return await Promise.all(
			baseAnimations.map(async (animation) => ({
				...animation,
				url: animation.storageId
					? await ctx.storage.getUrl(animation.storageId)
					: undefined,
			}))
		);
	},
});

// Get all animations (base + user's custom) - updated to use the new pattern
export const getAllAnimations = query({
	handler: async (ctx) => {
		const user = await getCurrentUserOrNull(ctx);

		// Get base animations
		const baseAnimations = await ctx.db
			.query("animations")
			.filter((q) => q.eq(q.field("isBaseAnimation"), true))
			.collect();

		let userAnimations: any[] = [];
		if (user) {
			userAnimations = await ctx.db
				.query("animations")
				.filter((q) =>
					q.and(
						q.eq(q.field("userId"), user._id),
						q.eq(q.field("isBaseAnimation"), false)
					)
				)
				.collect();
		}

		// Get URLs for all animations
		const allAnimations = [...baseAnimations, ...userAnimations];
		return await Promise.all(
			allAnimations.map(async (animation) => ({
				...animation,
				url: animation.storageId
					? await ctx.storage.getUrl(animation.storageId)
					: undefined,
			}))
		);
	},
});
