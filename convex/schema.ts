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
	}),
	recipients: defineTable({
		userId: v.id("users"),
		name: v.string(),
		email: v.string(),
		birthday: v.number(),
		sendAutomaticEmail: v.boolean(),
	}).index("by_userId", ["userId"]),
});
