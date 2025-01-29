import {
	internalAction,
	internalMutation,
	MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getBirthdayEmailHtml } from "../src/email-templates/birthday";
import { getReminderEmailHtml } from "../src/email-templates/reminder";
import { Id } from "./_generated/dataModel";
import { Event } from "./events";
import { resend, EMAIL_ERRORS, EMAIL_SENDER, RETRY_CONFIG } from "./emailUtils";

/**
 * emails.ts - Automated Email Reminder System
 *
 * This module handles the automated email reminder system for EventPulse.
 * It is responsible for:
 * 1. Sending automated event and birthday reminders
 * 2. Managing the reminder email scheduling system
 * 3. Providing core email sending functionality used by other modules
 *
 * Key components:
 * - Daily cron job for scheduling reminder emails
 * - Email sending action with retry mechanism
 * - Support for both event and birthday reminders
 */

// Types for reminder email scheduling
type UserNotification = {
	userId: Id<"users">;
	email: string;
	userName: string;
	reminderDays: number;
	emailReminders: {
		events: boolean;
		birthdays: boolean;
	};
};

/**
 * Sends a single reminder email to a user about upcoming events/birthdays.
 * Includes retry logic for rate limits and temporary failures.
 */
export const sendSingleReminderEmail = internalAction({
	args: {
		userId: v.id("users"),
		email: v.string(),
		userName: v.string(),
		reminderDays: v.number(),
		emailReminders: v.object({
			events: v.boolean(),
			birthdays: v.boolean(),
		}),
	},
	async handler(ctx, args) {
		const { userId, email, userName, reminderDays, emailReminders } = args;

		const now = new Date();
		const targetDate = new Date(
			now.getTime() + reminderDays * 24 * 60 * 60 * 1000
		);
		targetDate.setUTCHours(0, 0, 0, 0);

		const upcomingEvents = (await ctx.runQuery(
			internal.events.getUpcomingEvents,
			{
				userId,
				startDate: targetDate.getTime(),
				endDate: targetDate.getTime() + 24 * 60 * 60 * 1000 - 1,
				includeEvents: emailReminders.events,
				includeBirthdays: emailReminders.birthdays,
			}
		)) as Event[];

		if (upcomingEvents.length === 0) return;

		try {
			await resend.emails.send({
				from: EMAIL_SENDER,
				to: email,
				subject: `Events happening in ${reminderDays} days`,
				html: getReminderEmailHtml({
					userName,
					events: upcomingEvents,
				}),
			});
		} catch (err) {
			console.error(`Failed to send reminder email to ${email}:`, err);
			if (
				err instanceof Error &&
				(err.message.includes("rate") || err.message.includes("temporary"))
			) {
				throw new Error(RETRY_CONFIG.ERROR_MESSAGE);
			}
			throw new ConvexError(EMAIL_ERRORS.EMAIL_SEND_FAILED);
		}
	},
});

/**
 * Schedules a single reminder email with retry logic.
 * If a rate limit is hit, the email is rescheduled for 1 hour later.
 */
async function scheduleReminderEmail(
	ctx: MutationCtx,
	user: UserNotification,
	delayMs: number
) {
	try {
		await ctx.scheduler.runAfter(
			delayMs,
			internal.emails.sendSingleReminderEmail,
			user
		);
	} catch (err) {
		if (err instanceof Error && err.message === RETRY_CONFIG.ERROR_MESSAGE) {
			await ctx.scheduler.runAfter(
				RETRY_CONFIG.DELAY_MS,
				internal.emails.sendSingleReminderEmail,
				user
			);
		} else {
			throw err;
		}
	}
}

/**
 * Daily cron job that finds users needing reminders and schedules their emails.
 * Processes users in batches to avoid rate limits.
 */
export const sendReminderEmails = internalMutation({
	args: {},
	async handler(ctx): Promise<number> {
		const users = await ctx.db
			.query("users")
			.filter((q) =>
				q.neq(q.field("settings.notifications.emailReminders"), undefined)
			)
			.collect();

		// Get users with valid notification settings
		const validUsers = users.reduce<UserNotification[]>((acc, user) => {
			const notifications = user.settings?.notifications;
			if (!notifications?.emailReminders) return acc;

			const { reminderDays, emailReminders } = notifications;
			if (
				!reminderDays ||
				!(emailReminders.events || emailReminders.birthdays)
			) {
				return acc;
			}

			acc.push({
				userId: user._id,
				email: user.email,
				userName: user.name,
				reminderDays,
				emailReminders,
			});
			return acc;
		}, []);

		// Schedule all emails with appropriate delays
		await Promise.all(
			validUsers.map((user, index) =>
				scheduleReminderEmail(ctx, user, index * 200)
			)
		);

		return validUsers.length;
	},
});

/**
 * Sends a scheduled email (used by both automated and manual scheduling systems).
 * Handles custom messages, animations, and styling.
 */
export const sendScheduledEmail = internalAction({
	args: {
		recipientId: v.id("recipients"),
		date: v.number(),
		customMessage: v.optional(v.string()),
		subject: v.optional(v.string()),
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
		const recipient = await ctx.runQuery(
			internal.recipients.getRecipientInternal,
			{ id: args.recipientId }
		);

		if (!recipient) {
			throw new ConvexError(EMAIL_ERRORS.RECIPIENT_NOT_FOUND);
		}

		// Get the animation URL - either from storage or direct URL
		let animationUrl = args.animationUrl;
		if (!animationUrl && args.animationId) {
			const animation = await ctx.runQuery(internal.animations.getAnimation, {
				id: args.animationId,
			});

			if (!animation) {
				throw new ConvexError(EMAIL_ERRORS.ANIMATION_NOT_FOUND);
			}

			if (!animation.storageId) {
				throw new ConvexError(EMAIL_ERRORS.ANIMATION_NO_STORAGE);
			}

			const fetchedUrl = await ctx.runQuery(
				internal.animations.getAnimationUrlInternal,
				{ storageId: animation.storageId }
			);

			if (!fetchedUrl) {
				throw new ConvexError(EMAIL_ERRORS.ANIMATION_URL_FAILED);
			}

			animationUrl = fetchedUrl;
		}

		if (!animationUrl) {
			throw new ConvexError(EMAIL_ERRORS.ANIMATION_URL_FAILED);
		}

		// Create the email content
		const subject = args.subject || `Happy Birthday ${recipient.name}!`;
		const message =
			args.customMessage ||
			`Wishing you a fantastic birthday filled with joy and celebration!`;

		try {
			await resend.emails.send({
				from: EMAIL_SENDER,
				to: recipient.email,
				subject: subject,
				html: getBirthdayEmailHtml({
					subject,
					message,
					animationUrl,
					colorScheme: args.colorScheme,
				}),
			});
		} catch (err) {
			console.error(
				`Failed to send scheduled email to ${recipient.email}:`,
				err
			);
			throw new ConvexError(EMAIL_ERRORS.EMAIL_SEND_FAILED);
		}
	},
});
