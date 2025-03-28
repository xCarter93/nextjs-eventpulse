import { ConvexError, v } from "convex/values";
import {
	internalMutation,
	mutation,
	query,
	internalQuery,
} from "./_generated/server";
import { DEFAULT_FREE_FEATURES } from "./subscriptions";
import { PRO_TIER_LIMITS } from "../src/lib/subscriptions";

const DEFAULT_USER_STATE = {
	lastSignedInDate: Date.now(),
	hasSeenTour: false,
	settings: {
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
				holidays: false,
			},
		},
	},
};

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
			throw new ConvexError("User already exists");
		}

		// Create new user with all default values
		return await ctx.db.insert("users", {
			...args,
			...DEFAULT_USER_STATE,
		});
	},
});

export const getUser = query({
	async handler(ctx) {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

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

export const updateSettings = mutation({
	args: {
		settings: v.object({
			address: v.optional(
				v.object({
					city: v.string(),
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
						holidays: v.boolean(),
					}),
				})
			),
		}),
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

export const listUsers = internalQuery({
	args: {},
	async handler(ctx) {
		return await ctx.db.query("users").collect();
	},
});

export const updateLastSignIn = internalMutation({
	args: {
		tokenIdentifier: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", args.tokenIdentifier)
			)
			.first();

		// If no user found, just return without throwing error
		if (!user) {
			return;
		}

		await ctx.db.patch(user._id, {
			lastSignedInDate: Date.now(),
		});
	},
});

export const updateHasSeenTour = mutation({
	args: {
		hasSeenTour: v.boolean(),
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

		await ctx.db.patch(user._id, {
			hasSeenTour: args.hasSeenTour,
		});
	},
});
