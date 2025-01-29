import {
	mutation,
	query,
	internalAction,
	internalQuery,
	internalMutation,
	QueryCtx,
	MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Error messages
const ERRORS = {
	NOT_AUTHENTICATED: "You must be logged in to perform this action",
	USER_NOT_FOUND: "User account not found",
	ANIMATION_NOT_FOUND: "Animation not found",
	ACCESS_DENIED: "You don't have permission to access this animation",
} as const;

// Authentication helper
async function authenticateUser(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new ConvexError(ERRORS.NOT_AUTHENTICATED);
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.first();

	if (!user) {
		throw new ConvexError(ERRORS.USER_NOT_FOUND);
	}

	return { identity, user };
}

// Storage-related functions
export const generateUploadUrl = mutation(async (ctx) => {
	await authenticateUser(ctx);
	return await ctx.storage.generateUploadUrl();
});

export const getAnimationUrl = query({
	args: { storageId: v.id("_storage") },
	async handler(ctx, args) {
		return await ctx.storage.getUrl(args.storageId);
	},
});

// Public queries
export const list = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		await authenticateUser(ctx);

		return await ctx.db
			.query("animations")
			.filter((q) => q.eq(q.field("userId"), args.userId))
			.order("desc")
			.collect();
	},
});

// Public mutations
export const saveAnimation = mutation({
	args: {
		storageId: v.id("_storage"),
		name: v.string(),
		description: v.string(),
	},
	handler: async (ctx, args): Promise<Id<"animations">> => {
		const { user } = await authenticateUser(ctx);

		// Get user's subscription level
		const subscriptionLevel: "free" | "pro" = await ctx.runQuery(
			api.subscriptions.getUserSubscriptionLevel
		);

		// Calculate expiration date for free tier users (10 days from now)
		const expirationDate: number | undefined =
			subscriptionLevel === "free"
				? Date.now() + 10 * 24 * 60 * 60 * 1000 // 10 days in milliseconds
				: undefined;

		try {
			const animationId = await ctx.db.insert("animations", {
				storageId: args.storageId,
				name: args.name,
				description: args.description,
				userId: user._id,
				expirationDate,
			});
			return animationId;
		} catch (error) {
			if (error instanceof Error) {
				throw new ConvexError("Failed to save animation: " + error.message);
			}
			throw new ConvexError("Failed to save animation");
		}
	},
});

export const deleteUserAnimation = mutation({
	args: {
		id: v.id("animations"),
	},
	async handler(ctx, args) {
		const { user } = await authenticateUser(ctx);

		const animation = await ctx.db.get(args.id);
		if (!animation) {
			throw new ConvexError(ERRORS.ANIMATION_NOT_FOUND);
		}

		if (animation.userId !== user._id) {
			throw new ConvexError(ERRORS.ACCESS_DENIED);
		}

		try {
			// Delete the file from storage if it exists
			if (animation.storageId) {
				await ctx.storage.delete(animation.storageId);
			}

			// Delete the animation record
			await ctx.db.delete(args.id);
		} catch (error) {
			if (error instanceof Error) {
				throw new ConvexError("Failed to delete animation: " + error.message);
			}
			throw new ConvexError("Failed to delete animation");
		}
	},
});

// Internal queries
export const getAnimationUrlInternal = internalQuery({
	args: { storageId: v.id("_storage") },
	async handler(ctx, args) {
		return await ctx.storage.getUrl(args.storageId);
	},
});

export const getExpiredAnimations = internalQuery({
	args: { currentTime: v.number() },
	handler: async (ctx, args) => {
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
});

export const getAnimation = internalQuery({
	args: { id: v.id("animations") },
	async handler(ctx, args) {
		const animation = await ctx.db.get(args.id);
		if (!animation) {
			throw new ConvexError(ERRORS.ANIMATION_NOT_FOUND);
		}
		return animation;
	},
});

// Internal mutations
export const deleteAnimation = internalMutation({
	args: { id: v.id("animations") },
	handler: async (ctx, args) => {
		try {
			await ctx.db.delete(args.id);
		} catch (error) {
			if (error instanceof Error) {
				throw new ConvexError("Failed to delete animation: " + error.message);
			}
			throw new ConvexError("Failed to delete animation");
		}
	},
});

// Internal actions
export const cleanupFreeUserAnimations = internalAction({
	handler: async (ctx) => {
		try {
			const animationsToDelete = await ctx.runQuery(
				internal.animations.getExpiredAnimations,
				{
					currentTime: Date.now(),
				}
			);

			// Delete each animation and its associated file
			for (const animation of animationsToDelete) {
				if (animation.storageId) {
					await ctx.storage.delete(animation.storageId);
				}
				await ctx.runMutation(internal.animations.deleteAnimation, {
					id: animation._id,
				});
			}
		} catch (error) {
			if (error instanceof Error) {
				throw new ConvexError("Failed to cleanup animations: " + error.message);
			}
			throw new ConvexError("Failed to cleanup animations");
		}
	},
});
