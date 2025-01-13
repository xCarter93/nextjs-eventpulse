import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const scheduleCustomEmail = mutation({
	args: {
		recipientId: v.id("recipients"),
		scheduledDate: v.number(),
		message: v.string(),
		subject: v.string(),
		animationId: v.optional(v.id("animations")),
		animationUrl: v.optional(v.string()),
	},
	async handler(ctx, args) {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		if (!identity.email) {
			throw new ConvexError("User email is required");
		}

		// Verify user has access to this recipient
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		const recipient = await ctx.db.get(args.recipientId);
		if (!recipient || (recipient as Doc<"recipients">).userId !== user._id) {
			throw new ConvexError("Recipient not found or access denied");
		}

		// Validate animationUrl if provided
		if (args.animationUrl && !args.animationUrl.match(/\.(gif|jpe?g|png)$/i)) {
			throw new ConvexError("Invalid image URL format");
		}

		// Schedule the email
		await ctx.scheduler.runAt(
			args.scheduledDate,
			internal.emails.sendScheduledEmail,
			{
				recipientId: args.recipientId,
				date: args.scheduledDate,
				customMessage: args.message,
				subject: args.subject,
				animationId: args.animationId,
				animationUrl: args.animationUrl,
			}
		);
	},
});

export const listScheduledEmails = query({
	args: {},
	async handler(ctx) {
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

		// Get all scheduled emails (both pending and completed)
		const scheduledEmails = await ctx.db.system
			.query("_scheduled_functions")
			.filter((q) => q.eq(q.field("name"), "emails.js:sendScheduledEmail"))
			.collect();

		console.log("Found scheduled emails:", scheduledEmails);

		// Enrich emails with recipient details
		const enrichedEmails = await Promise.all(
			scheduledEmails.map(async (email) => {
				console.log("Processing email:", email);
				const args = email.args[0] as {
					recipientId: Id<"recipients">;
					date: number;
					customMessage?: string;
					subject?: string;
					animationId?: Id<"animations">;
				};

				const recipient = (await ctx.db.get(
					args.recipientId
				)) as Doc<"recipients"> | null;

				console.log("Found recipient:", recipient);

				// Only include emails for recipients that belong to this user
				if (!recipient || recipient.userId !== user._id) {
					console.log("Skipping email - recipient not found or access denied");
					return null;
				}

				const enrichedEmail = {
					_id: email._id,
					scheduledTime: email.scheduledTime,
					status: email.state.kind,
					completedTime: email.completedTime,
					recipient: {
						name: recipient.name,
						email: recipient.email,
					},
					customMessage: args.customMessage,
					subject: args.subject,
					isAutomated: !args.customMessage,
					error: email.state.kind === "failed" ? email.state.error : undefined,
				};

				console.log("Enriched email:", enrichedEmail);
				return enrichedEmail;
			})
		);

		// Filter out null values and sort by scheduled time (most recent first)
		const filteredEmails = enrichedEmails
			.filter((email): email is NonNullable<typeof email> => email !== null)
			.sort((a, b) => b.scheduledTime - a.scheduledTime);

		console.log("Final filtered emails:", filteredEmails);
		return filteredEmails;
	},
});

export const cancelScheduledEmail = mutation({
	args: {
		scheduledEmailId: v.id("_scheduled_functions"),
	},
	async handler(ctx, args) {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		// Verify user has access to this scheduled email
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		// Get the scheduled email
		const scheduledEmail = await ctx.db.system.get(args.scheduledEmailId);
		if (!scheduledEmail) {
			throw new ConvexError("Scheduled email not found");
		}

		// Verify the recipient belongs to this user
		const emailArgs = scheduledEmail.args[0] as {
			recipientId: Id<"recipients">;
			date: number;
			customMessage?: string;
			subject?: string;
		};
		const recipient = (await ctx.db.get(
			emailArgs.recipientId
		)) as Doc<"recipients"> | null;
		if (!recipient || recipient.userId !== user._id) {
			throw new ConvexError("Access denied");
		}

		// Cancel the scheduled email
		await ctx.scheduler.cancel(args.scheduledEmailId);
	},
});

export const deleteScheduledEmailsForRecipient = internalMutation({
	args: {
		recipientId: v.id("recipients"),
	},
	async handler(ctx, args) {
		// Find all scheduled emails for this recipient
		const scheduledEmails = await ctx.db.system
			.query("_scheduled_functions")
			.filter((q) => q.eq(q.field("name"), "emails.js:sendScheduledEmail"))
			.collect();

		// Cancel each scheduled email that matches the recipient
		await Promise.all(
			scheduledEmails.map(async (email) => {
				const emailArgs = email.args[0] as {
					recipientId: Id<"recipients">;
					date: number;
					customMessage?: string;
					subject?: string;
				};

				if (emailArgs.recipientId === args.recipientId) {
					await ctx.scheduler.cancel(email._id);
				}
			})
		);
	},
});
