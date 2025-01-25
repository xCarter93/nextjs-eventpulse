import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

const DEFAULT_SUBSCRIPTION = {
	tier: "free" as const,
	features: {
		maxRecipients: 5,
		maxAnimations: 10,
		hasAutoSend: false,
		hasAdvancedTemplates: false,
	},
};

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
			holidays: false,
		},
	},
};

export const createUser = internalMutation({
	args: {
		tokenIdentifier: v.string(),
		name: v.string(),
		image: v.string(),
		email: v.string(),
	},
	async handler(ctx, args) {
		const existing = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", args.tokenIdentifier)
			)
			.first();

		if (existing) {
			return existing._id;
		}

		return await ctx.db.insert("users", {
			tokenIdentifier: args.tokenIdentifier,
			name: args.name,
			image: args.image,
			email: args.email,
			subscription: DEFAULT_SUBSCRIPTION,
			settings: DEFAULT_SETTINGS,
		});
	},
});

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

export const getUser = query({
	async handler(ctx) {
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

		return user;
	},
});
