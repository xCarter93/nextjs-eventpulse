import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
