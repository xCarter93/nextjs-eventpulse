import { ConvexError, v } from "convex/values";
import {
	internalMutation,
	mutation,
	query,
	internalQuery,
	QueryCtx,
	MutationCtx,
} from "./_generated/server";
import { DEFAULT_FREE_FEATURES } from "./subscriptions";
import { PRO_TIER_LIMITS } from "../src/lib/subscriptions";

const USER_ERRORS = {
	NOT_AUTHENTICATED: "Not authenticated",
	USER_NOT_FOUND: "User not found",
	USER_EXISTS: "User already exists",
} as const;

const DEFAULT_SETTINGS = {
	calendar: {
		showHolidays: true,
	},
	upcomingEvents: {
		daysToShow: 30,
		maxEvents: 10,
	},
	notifications: {
		reminderDays: 7,
		emailReminders: {
			events: true,
			birthdays: true,
		},
	},
};

/**
 * Helper function to authenticate and retrieve the current user.
 * Throws an error if user is not authenticated or not found.
 */
async function authenticateUser(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new ConvexError(USER_ERRORS.NOT_AUTHENTICATED);
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.first();

	if (!user) {
		throw new ConvexError(USER_ERRORS.USER_NOT_FOUND);
	}

	return { identity, user };
}

/**
 * Helper function to get the current user without throwing.
 * Returns null if user is not authenticated or not found.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		return null;
	}

	return await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.first();
}

/**
 * Helper function to get the current user, throwing if not found.
 */
export async function getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx) {
	const user = await getCurrentUser(ctx);
	if (!user) {
		throw new ConvexError(USER_ERRORS.NOT_AUTHENTICATED);
	}
	return user;
}

/**
 * Creates a new user with default settings.
 * Used internally by the auth webhook.
 */
export const createUser = internalMutation({
	args: {
		name: v.string(),
		tokenIdentifier: v.string(),
		image: v.string(),
		email: v.string(),
	},
	async handler(ctx, args) {
		// Check if user already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", args.tokenIdentifier)
			)
			.first();

		if (existingUser) {
			throw new ConvexError(USER_ERRORS.USER_EXISTS);
		}

		// Create new user with default settings
		return await ctx.db.insert("users", {
			name: args.name,
			tokenIdentifier: args.tokenIdentifier,
			image: args.image,
			email: args.email,
			settings: DEFAULT_SETTINGS,
		});
	},
});

/**
 * Gets the current user's information including subscription status.
 * Returns null if user is not authenticated.
 */
export const getUser = query({
	async handler(ctx) {
		const user = await getCurrentUser(ctx);
		if (!user) {
			return null;
		}

		// Get subscription
		const subscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		return {
			...user,
			subscription: {
				tier: subscription ? "pro" : "free",
				features: subscription ? PRO_TIER_LIMITS : DEFAULT_FREE_FEATURES,
			},
		};
	},
});

/**
 * Updates user settings, merging with existing settings.
 */
export const updateSettings = mutation({
	args: {
		settings: v.object({
			address: v.optional(
				v.object({
					line1: v.string(),
					line2: v.optional(v.string()),
					city: v.string(),
					state: v.string(),
					postalCode: v.string(),
					country: v.string(),
					countryCode: v.string(),
					coordinates: v.object({
						latitude: v.number(),
						longitude: v.number(),
					}),
				})
			),
			calendar: v.optional(
				v.object({
					showHolidays: v.boolean(),
				})
			),
			upcomingEvents: v.optional(
				v.object({
					daysToShow: v.number(),
					maxEvents: v.number(),
				})
			),
			notifications: v.optional(
				v.object({
					reminderDays: v.number(),
					emailReminders: v.object({
						events: v.boolean(),
						birthdays: v.boolean(),
					}),
				})
			),
		}),
	},
	async handler(ctx, args) {
		const { user } = await authenticateUser(ctx);

		// Merge new settings with existing settings
		const currentSettings = user.settings || {};
		const newSettings = {
			...currentSettings,
			...args.settings,
		};

		await ctx.db.patch(user._id, {
			settings: newSettings,
		});

		return newSettings;
	},
});

/**
 * Lists all users. Internal use only.
 */
export const listUsers = internalQuery({
	args: {},
	async handler(ctx) {
		return await ctx.db.query("users").collect();
	},
});
