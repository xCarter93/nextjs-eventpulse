import { ConvexError, v } from "convex/values";
import {
	internalMutation,
	mutation,
	query,
	internalQuery,
} from "./_generated/server";
import { DEFAULT_FREE_FEATURES } from "./subscriptions";
import { PRO_TIER_LIMITS } from "../src/lib/subscriptions";
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";
import { userSettingsValidator } from "./lib/validators";
import { DEFAULT_USER_SETTINGS } from "./lib/constants";
import { INDEX_NAMES } from "./lib/database";

const DEFAULT_USER_STATE = {
	lastSignedInDate: DEFAULT_USER_SETTINGS.LAST_SIGNED_IN_DATE(),
	hasSeenTour: DEFAULT_USER_SETTINGS.HAS_SEEN_TOUR,
	settings: {
		calendar: {
			showHolidays: DEFAULT_USER_SETTINGS.CALENDAR.SHOW_HOLIDAYS,
		},
		upcomingEvents: {
			daysToShow: DEFAULT_USER_SETTINGS.UPCOMING_EVENTS.DAYS_TO_SHOW,
			maxEvents: DEFAULT_USER_SETTINGS.UPCOMING_EVENTS.MAX_EVENTS,
		},
		notifications: {
			reminderDays: DEFAULT_USER_SETTINGS.NOTIFICATIONS.REMINDER_DAYS,
			emailReminders: {
				events: DEFAULT_USER_SETTINGS.NOTIFICATIONS.EMAIL_REMINDERS.EVENTS,
				birthdays:
					DEFAULT_USER_SETTINGS.NOTIFICATIONS.EMAIL_REMINDERS.BIRTHDAYS,
				holidays: DEFAULT_USER_SETTINGS.NOTIFICATIONS.EMAIL_REMINDERS.HOLIDAYS,
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
			.withIndex(INDEX_NAMES.BY_TOKEN_IDENTIFIER, (q) =>
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
		const user = await getCurrentUserOrNull(ctx);

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
		settings: userSettingsValidator,
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

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
			.withIndex(INDEX_NAMES.BY_TOKEN_IDENTIFIER, (q) =>
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
		const user = await getCurrentUser(ctx);

		await ctx.db.patch(user._id, {
			hasSeenTour: args.hasSeenTour,
		});
	},
});
