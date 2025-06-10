import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
	userSettingsValidator,
	recipientMetadataValidator,
} from "./lib/validators";

export default defineSchema({
	users: defineTable({
		name: v.string(),
		tokenIdentifier: v.string(),
		image: v.string(),
		email: v.string(),
		lastSignedInDate: v.optional(v.number()),
		hasSeenTour: v.optional(v.boolean()),
		lastGoogleCalendarSync: v.optional(v.number()),
		settings: v.optional(userSettingsValidator),
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
	groups: defineTable({
		userId: v.id("users"),
		name: v.string(),
		color: v.optional(v.string()),
		description: v.optional(v.string()),
	}).index("by_userId", ["userId"]),
	recipients: defineTable({
		userId: v.id("users"),
		name: v.string(),
		email: v.string(),
		birthday: v.number(),
		groupIds: v.optional(v.array(v.id("groups"))),
		metadata: v.optional(recipientMetadataValidator),
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
