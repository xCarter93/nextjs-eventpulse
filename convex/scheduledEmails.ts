import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { canScheduleForDate } from "../src/lib/permissions";
import { api } from "./_generated/api";
import { EMAIL_ERRORS, validateImageUrl, authenticateUser } from "./emailUtils";

/**
 * scheduledEmails.ts - Custom Email Scheduling System
 *
 * This module handles user-initiated custom email scheduling in EventPulse.
 * It is responsible for:
 * 1. Scheduling custom emails for future delivery
 * 2. Managing scheduled email lifecycle (create, list, cancel)
 * 3. Cleaning up scheduled emails when recipients are deleted
 *
 * Key features:
 * - Custom message and subject support
 * - Animation/GIF integration
 * - Color scheme customization
 * - Subscription-based scheduling limits
 */

/**
 * Schedules a custom email for future delivery.
 * Validates user permissions, recipient access, and scheduling constraints.
 */
export const scheduleCustomEmail = mutation({
	args: {
		recipientId: v.id("recipients"),
		scheduledDate: v.number(),
		message: v.string(),
		subject: v.string(),
		animationId: v.optional(v.id("animations")),
		animationUrl: v.optional(v.string()),
		colorScheme: v.optional(
			v.object({
				primary: v.string(),
				secondary: v.string(),
				accent: v.string(),
				background: v.string(),
			})
		),
	},
	async handler(ctx, args) {
		const { identity, user } = await authenticateUser(ctx);

		if (!identity.email) {
			throw new ConvexError(EMAIL_ERRORS.USER_EMAIL_REQUIRED);
		}

		// Check subscription-based scheduling permissions
		const subscriptionLevel = await ctx.runQuery(
			api.subscriptions.getUserSubscriptionLevel
		);

		if (!canScheduleForDate(new Date(args.scheduledDate), subscriptionLevel)) {
			throw new ConvexError(
				"Free users can only schedule emails up to 7 days in advance. Upgrade to Pro to schedule emails further ahead."
			);
		}

		// Verify recipient access
		const recipient = await ctx.db.get(args.recipientId);
		if (!recipient || (recipient as Doc<"recipients">).userId !== user._id) {
			throw new ConvexError(EMAIL_ERRORS.ACCESS_DENIED);
		}

		// Validate animation URL if provided
		if (args.animationUrl && !(await validateImageUrl(args.animationUrl))) {
			throw new ConvexError(EMAIL_ERRORS.INVALID_IMAGE_URL);
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
				colorScheme: args.colorScheme,
			}
		);
	},
});

/**
 * Lists all scheduled emails for the authenticated user.
 * Returns both pending and completed emails, enriched with recipient details.
 */
export const listScheduledEmails = query({
	async handler(ctx) {
		try {
			const { user } = await authenticateUser(ctx);

			// Get all scheduled emails
			const scheduledEmails = await ctx.db.system
				.query("_scheduled_functions")
				.filter((q) => q.eq(q.field("name"), "emails.js:sendScheduledEmail"))
				.collect();

			// Enrich with recipient details
			const enrichedEmails = await Promise.all(
				scheduledEmails.map(async (email) => {
					const args = email.args[0] as {
						recipientId: Id<"recipients">;
						date: number;
						customMessage?: string;
						subject?: string;
						animationId?: Id<"animations">;
					};

					const recipient = await ctx.db.get(args.recipientId);

					if (!recipient || recipient.userId !== user._id) {
						return null;
					}

					return {
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
						error:
							email.state.kind === "failed" ? email.state.error : undefined,
					};
				})
			);

			// Filter out null values and sort by scheduled time
			return enrichedEmails
				.filter((email): email is NonNullable<typeof email> => email !== null)
				.sort((a, b) => b.scheduledTime - a.scheduledTime);
		} catch (err) {
			if (
				err instanceof ConvexError &&
				err.message === EMAIL_ERRORS.NOT_AUTHENTICATED
			) {
				return [];
			}
			throw err;
		}
	},
});

/**
 * Cancels a scheduled email.
 * Verifies user ownership of the email before cancellation.
 */
export const cancelScheduledEmail = mutation({
	args: {
		scheduledEmailId: v.id("_scheduled_functions"),
	},
	async handler(ctx, args) {
		const { user } = await authenticateUser(ctx);

		const scheduledEmail = await ctx.db.system.get(args.scheduledEmailId);
		if (!scheduledEmail) {
			throw new ConvexError("Scheduled email not found");
		}

		// Verify recipient ownership
		const emailArgs = scheduledEmail.args[0] as {
			recipientId: Id<"recipients">;
			date: number;
			customMessage?: string;
			subject?: string;
		};

		const recipient = await ctx.db.get(emailArgs.recipientId);
		if (!recipient || recipient.userId !== user._id) {
			throw new ConvexError(EMAIL_ERRORS.ACCESS_DENIED);
		}

		await ctx.scheduler.cancel(args.scheduledEmailId);
	},
});

/**
 * Internal mutation to clean up scheduled emails when a recipient is deleted.
 * Cancels all pending emails for the specified recipient.
 */
export const deleteScheduledEmailsForRecipient = internalMutation({
	args: {
		recipientId: v.id("recipients"),
	},
	async handler(ctx, args) {
		const scheduledEmails = await ctx.db.system
			.query("_scheduled_functions")
			.filter((q) => q.eq(q.field("name"), "emails.js:sendScheduledEmail"))
			.collect();

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
