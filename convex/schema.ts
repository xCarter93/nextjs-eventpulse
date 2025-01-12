import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		name: v.string(),
		tokenIdentifier: v.string(),
		image: v.string(),
		email: v.string(),
		subscription: v.object({
			tier: v.union(v.literal("free"), v.literal("pro")),
			features: v.object({
				maxRecipients: v.number(),
				maxAnimations: v.number(),
				hasAutoSend: v.boolean(),
				hasAdvancedTemplates: v.boolean(),
			}),
		}),
	}).index("by_tokenIdentifier", ["tokenIdentifier"]),
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
		sendAutomaticEmail: v.boolean(),
	}).index("by_userId", ["userId"]),
});
