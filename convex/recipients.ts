import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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
		sendAutomaticEmail: v.boolean(),
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
			sendAutomaticEmail: args.sendAutomaticEmail,
		});

		// If automatic emails are enabled, schedule the next email
		if (args.sendAutomaticEmail) {
			const nextBirthday = getNextOccurrence(args.birthday);
			await ctx.scheduler.runAt(
				nextBirthday,
				internal.emails.sendScheduledEmail,
				{
					recipientId,
					date: nextBirthday,
				}
			);
		}

		return recipientId;
	},
});

export const updateRecipient = mutation({
	args: {
		id: v.id("recipients"),
		name: v.string(),
		email: v.string(),
		birthday: v.number(),
		sendAutomaticEmail: v.boolean(),
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
			sendAutomaticEmail: args.sendAutomaticEmail,
		});

		// Cancel any existing scheduled emails
		const scheduledFunctions = await ctx.db.system
			.query("_scheduled_functions")
			.filter((q) => q.eq(q.field("name"), "emails.js:sendScheduledEmail"))
			.collect();

		// Find and cancel matching functions
		for (const fn of scheduledFunctions) {
			const emailArgs = fn.args[0] as {
				recipientId: Id<"recipients">;
				date: number;
				customMessage?: string;
				subject?: string;
			};
			if (emailArgs.recipientId === args.id) {
				await ctx.scheduler.cancel(fn._id);
			}
		}

		// If automatic emails are enabled, schedule the next email
		if (args.sendAutomaticEmail) {
			const nextBirthday = getNextOccurrence(args.birthday);
			await ctx.scheduler.runAt(
				nextBirthday,
				internal.emails.sendScheduledEmail,
				{
					recipientId: args.id,
					date: nextBirthday,
				}
			);
		}
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

export const getRecipient = internalQuery({
	args: { id: v.id("recipients") },
	async handler(ctx, args) {
		return await ctx.db.get(args.id);
	},
});

// Helper function to calculate the next occurrence of a date
function getNextOccurrence(timestamp: number): number {
	const date = new Date(timestamp);
	const today = new Date();
	const nextDate = new Date(
		today.getFullYear(),
		date.getMonth(),
		date.getDate(),
		9, // Send at 9 AM
		0,
		0
	);

	// If the date has already passed this year, schedule for next year
	if (nextDate.getTime() < today.getTime()) {
		nextDate.setFullYear(today.getFullYear() + 1);
	}

	return nextDate.getTime();
}
