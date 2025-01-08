import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const getRecipients = query({
	args: { tokenIdentifier: v.string() },
	async handler(ctx, args) {
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", args.tokenIdentifier)
			)
			.first();

		if (!user) {
			return [];
		}

		const recipients = await ctx.db
			.query("recipients")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.collect();

		return recipients;
	},
});

export const addRecipient = mutation({
	args: {
		tokenIdentifier: v.string(),
		name: v.string(),
		email: v.string(),
		birthday: v.number(),
	},
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

		const recipientId = await ctx.db.insert("recipients", {
			userId: user._id,
			name: args.name,
			email: args.email,
			birthday: args.birthday,
		});

		return recipientId;
	},
});

export const updateRecipient = mutation({
	args: {
		tokenIdentifier: v.string(),
		id: v.id("recipients"),
		name: v.string(),
		email: v.string(),
		birthday: v.number(),
	},
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

		const existing = await ctx.db.get(args.id);
		if (!existing || existing.userId !== user._id) {
			throw new ConvexError("Recipient not found or access denied");
		}

		await ctx.db.patch(args.id, {
			name: args.name,
			email: args.email,
			birthday: args.birthday,
		});
	},
});

export const deleteRecipient = mutation({
	args: {
		tokenIdentifier: v.string(),
		id: v.id("recipients"),
	},
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

		const existing = await ctx.db.get(args.id);
		if (!existing || existing.userId !== user._id) {
			throw new ConvexError("Recipient not found or access denied");
		}

		await ctx.db.delete(args.id);
	},
});
