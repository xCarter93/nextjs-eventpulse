import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

const DEFAULT_SUBSCRIPTION = {
	tier: "free" as const,
	features: {
		maxRecipients: 5,
		maxAnimations: 10,
		hasAutoSend: false,
		hasAdvancedTemplates: false,
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
		});
	},
});

export const getUser = query({
	args: { tokenIdentifier: v.string() },
	async handler(ctx, args) {
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", args.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		return user;
	},
});
