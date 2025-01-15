import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";

export const getRecipients = query({
	async handler(ctx) {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			return [];
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
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
		name: v.string(),
		email: v.string(),
		birthday: v.number(),
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
		id: v.id("recipients"),
		name: v.string(),
		email: v.string(),
		birthday: v.number(),
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

export const updateRecipientMetadata = mutation({
	args: {
		id: v.id("recipients"),
		metadata: v.object({
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

		const existing = await ctx.db.get(args.id);
		if (!existing || existing.userId !== user._id) {
			throw new ConvexError("Recipient not found or access denied");
		}

		await ctx.db.patch(args.id, {
			metadata: args.metadata,
		});
	},
});

export const deleteRecipient = mutation({
	args: {
		id: v.id("recipients"),
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

		const existing = await ctx.db.get(args.id);
		if (!existing || existing.userId !== user._id) {
			throw new ConvexError("Recipient not found or access denied");
		}

		// Delete any scheduled emails for this recipient
		await ctx.runMutation(
			internal.scheduledEmails.deleteScheduledEmailsForRecipient,
			{
				recipientId: args.id,
			}
		);

		await ctx.db.delete(args.id);
	},
});

export const getRecipient = query({
	args: { id: v.id("recipients") },
	async handler(ctx, args) {
		const identity = await ctx.auth.getUserIdentity();
		const recipient = await ctx.db.get(args.id);

		if (!recipient) {
			throw new ConvexError("Recipient not found");
		}

		// If this is an internal call (no user identity), allow access
		if (!identity) {
			return recipient;
		}

		// For authenticated users, verify ownership
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		if (recipient.userId !== user._id) {
			throw new ConvexError("Access denied");
		}

		return recipient;
	},
});
