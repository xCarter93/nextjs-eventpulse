import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import { getSubscriptionLimits } from "../src/lib/subscriptions";

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

		// Get current recipient count and subscription level
		const recipients = await ctx.db
			.query("recipients")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.collect();

		const subscriptionLevel = await ctx.runQuery(
			api.subscriptions.getUserSubscriptionLevel
		);
		const limits = getSubscriptionLimits(subscriptionLevel);

		// Check if user has reached their recipient limit
		if (recipients.length >= limits.maxRecipients) {
			throw new ConvexError(
				"You have reached your recipient limit. Upgrade to Pro for unlimited recipients."
			);
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

		// Get user's subscription level
		const subscriptionLevel = await ctx.runQuery(
			api.subscriptions.getUserSubscriptionLevel
		);

		// If user is not on pro plan and trying to update address, throw error
		if (subscriptionLevel !== "pro" && args.metadata.address) {
			throw new ConvexError("Address management requires a Pro subscription");
		}

		// If an anniversary date is being set or updated
		if (args.metadata.anniversaryDate) {
			// Check if there's an existing anniversary event for this recipient
			const existingEvents = await ctx.db
				.query("customEvents")
				.withIndex("by_userId", (q) => q.eq("userId", user._id))
				.collect();

			const existingAnniversaryEvent = existingEvents.find(
				(event) => event.name === `Anniversary with ${existing.name}`
			);

			// If no existing anniversary event, create one
			if (!existingAnniversaryEvent) {
				await ctx.db.insert("customEvents", {
					userId: user._id,
					name: `Anniversary with ${existing.name}`,
					date: args.metadata.anniversaryDate,
					isRecurring: true,
				});
			} else {
				// Update the existing anniversary event
				await ctx.db.patch(existingAnniversaryEvent._id, {
					date: args.metadata.anniversaryDate,
				});
			}
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

// Internal query for system use
export const getRecipientInternal = internalQuery({
	args: { id: v.id("recipients") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

// Public query with auth checks
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

export const listRecipients = internalQuery({
	args: {
		userId: v.id("users"),
	},
	async handler(ctx, args) {
		return await ctx.db
			.query("recipients")
			.filter((q) => q.eq(q.field("userId"), args.userId))
			.collect();
	},
});
