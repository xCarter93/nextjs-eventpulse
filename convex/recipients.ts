import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import { getSubscriptionLimits } from "../src/lib/subscriptions";
import { 
	authorizeRecipientAccess, 
	getCurrentUser, 
	getCurrentUserOrNull,
	getUserWithSubscription,
	requireProSubscription,
	authorizeResourceAccess
} from "./lib/auth";
import { recipientMetadataValidator } from "./lib/validators";

export const getRecipients = query({
	async handler(ctx) {
		const user = await getCurrentUserOrNull(ctx);

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
		const { user, subscriptionLevel } = await getUserWithSubscription(ctx);

		// Get current recipient count
		const recipients = await ctx.db
			.query("recipients")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.collect();

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
		await authorizeRecipientAccess(ctx, args.id);

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
		metadata: recipientMetadataValidator,
	},
	async handler(ctx, args) {
		const { user, resource: existing } = await authorizeResourceAccess(
			ctx,
			args.id,
			"Recipient"
		);

		// Get user's subscription level
		const subscription = await ctx.db
			.query("subscriptions")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first();

		const subscriptionLevel = subscription ? "pro" : "free";

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
		const { user, resource: existing } = await authorizeResourceAccess(
			ctx,
			args.id,
			"Recipient"
		);

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
		const recipient = await ctx.db.get(args.id);

		if (!recipient) {
			throw new ConvexError("Recipient not found");
		}

		// If this is an internal call (no user identity), allow access
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return recipient;
		}

		// For authenticated users, verify ownership
		const user = await getCurrentUser(ctx);

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
