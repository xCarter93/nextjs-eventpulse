import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		name: v.string(),
		tokenIdentifier: v.string(),
		image: v.string(),
		email: v.string(),
		lastSignedInDate: v.optional(v.number()),
		hasSeenTour: v.optional(v.boolean()),
		lastGoogleCalendarSync: v.optional(v.number()),
		settings: v.optional(
			v.object({
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
			})
		),
	}).index("by_tokenIdentifier", ["tokenIdentifier"]),
	subscriptions: defineTable({
		userId: v.id("users"),
		stripeCustomerId: v.string(),
		stripeSubscriptionId: v.string(),
		stripePriceId: v.string(),
		stripeCurrentPeriodEnd: v.number(),
		stripeCancelAtPeriodEnd: v.boolean(),
	})
		.index("by_userId", ["userId"])
		.index("by_stripeCustomerId", ["stripeCustomerId"])
		.index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),
	animations: defineTable({
		userId: v.optional(v.id("users")),
		storageId: v.optional(v.id("_storage")),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		isBaseAnimation: v.optional(v.boolean()),
		expirationDate: v.optional(v.number()),
	}).index("by_expiration", ["expirationDate"]),
	recipients: defineTable({
		userId: v.id("users"),
		name: v.string(),
		email: v.string(),
		birthday: v.number(),
		metadata: v.optional(
			v.object({
				relation: v.optional(
					v.union(
						v.literal("friend"),
						v.literal("parent"),
						v.literal("spouse"),
						v.literal("sibling")
					)
				),
				anniversaryDate: v.optional(v.number()),
				notes: v.optional(v.string()),
				nickname: v.optional(v.string()),
				phoneNumber: v.optional(v.string()),
				address: v.optional(
					v.object({
						city: v.optional(v.string()),
						country: v.optional(v.string()),
						coordinates: v.optional(
							v.object({
								latitude: v.number(),
								longitude: v.number(),
							})
						),
					})
				),
			})
		),
	}).index("by_userId", ["userId"]),
	customEvents: defineTable({
		userId: v.id("users"),
		name: v.string(),
		date: v.number(),
		isRecurring: v.boolean(),
		source: v.optional(v.union(v.literal("google"), v.literal("manual"))),
	}).index("by_userId", ["userId"]),
	audioFiles: defineTable({
		userId: v.id("users"),
		storageId: v.id("_storage"),
		title: v.string(),
		isRecorded: v.boolean(),
		createdAt: v.number(),
	}).index("by_userId", ["userId"]),
});
