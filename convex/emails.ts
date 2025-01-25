import { Resend } from "resend";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getBirthdayEmailHtml } from "../src/email-templates/birthday";
import { getReminderEmailHtml } from "../src/email-templates/reminder";

const resend = new Resend(process.env.RESEND_API_KEY);

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
			{
				id: args.recipientId,
			}
		);

		if (!recipient) {
			return;
		}

		// Get the animation URL - either from storage or direct URL
		let animationUrl = args.animationUrl;
		if (!animationUrl && args.animationId) {
			// For custom emails, use the specified animation
			const animation = await ctx.runQuery(internal.animations.getAnimation, {
				id: args.animationId,
			});

			if (!animation) {
				console.error("Animation not found");
				throw new ConvexError("Animation not found");
			}

			if (!animation.storageId) {
				console.error("Animation has no storage ID");
				throw new ConvexError("Animation has no storage ID");
			}

			// Get the animation URL
			const fetchedUrl = await ctx.runQuery(
				internal.animations.getAnimationUrlInternal,
				{
					storageId: animation.storageId as Id<"_storage">,
				}
			);

			if (!fetchedUrl) {
				console.error("Failed to get animation URL");
				throw new ConvexError("Failed to get animation URL");
			}

			animationUrl = fetchedUrl;
		} else if (!animationUrl) {
			// For automated emails, get a random base animation
			const animation = await ctx.runQuery(
				internal.animations.getBaseAnimation
			);

			if (!animation || !animation.storageId) {
				console.error("No base animation found");
				throw new ConvexError("No base animation found");
			}

			const fetchedUrl = await ctx.runQuery(
				internal.animations.getAnimationUrlInternal,
				{
					storageId: animation.storageId as Id<"_storage">,
				}
			);

			if (!fetchedUrl) {
				console.error("Failed to get animation URL");
				throw new ConvexError("Failed to get animation URL");
			}

			animationUrl = fetchedUrl;
		}

		// Create the email content
		const subject = args.subject || `Happy Birthday ${recipient.name}!`;
		const message =
			args.customMessage ||
			`Wishing you a fantastic birthday filled with joy and celebration!`;

		try {
			// Send the email using Resend
			await resend.emails.send({
				from: "EventPulse <onboarding@resend.dev>",
				to: recipient.email,
				subject: subject,
				html: getBirthdayEmailHtml({
					subject,
					message,
					animationUrl,
					colorScheme: args.colorScheme,
				}),
			});
		} catch (error) {
			console.error("Failed to send email:", error);
			throw error;
		}
	},
});

// Helper function to get upcoming events for a user
export const getUpcomingEvents = internalQuery({
	args: {
		userId: v.id("users"),
		startDate: v.number(),
		endDate: v.number(),
		includeEvents: v.boolean(),
		includeBirthdays: v.boolean(),
		includeHolidays: v.boolean(),
	},
	async handler(ctx, args) {
		const events: Array<{
			type: "birthday" | "event" | "holiday";
			name: string;
			date: Date;
			description?: string;
		}> = [];

		// Get birthdays if enabled
		if (args.includeBirthdays) {
			const recipients = await ctx.runQuery(
				internal.recipients.listRecipients,
				{
					userId: args.userId,
				}
			);

			for (const recipient of recipients) {
				const birthdayDate = new Date(recipient.birthday);
				const thisYearBirthday = new Date(
					new Date().getFullYear(),
					birthdayDate.getMonth(),
					birthdayDate.getDate()
				);

				if (
					thisYearBirthday.getTime() >= args.startDate &&
					thisYearBirthday.getTime() <= args.endDate
				) {
					events.push({
						type: "birthday",
						name: recipient.name,
						date: thisYearBirthday,
						description: `Birthday celebration`,
					});
				}
			}
		}

		// Get custom events if enabled
		if (args.includeEvents) {
			const customEvents = await ctx.runQuery(internal.events.listEvents, {
				userId: args.userId,
			});

			for (const event of customEvents) {
				const eventDate = new Date(event.date);
				if (
					eventDate.getTime() >= args.startDate &&
					eventDate.getTime() <= args.endDate
				) {
					events.push({
						type: "event",
						name: event.name,
						date: eventDate,
					});
				}
			}
		}

		// Get holidays if enabled
		if (args.includeHolidays) {
			const holidays = await ctx.runQuery(internal.holidays.listHolidays, {
				startDate: args.startDate,
				endDate: args.endDate,
			});

			for (const holiday of holidays) {
				events.push({
					type: "holiday",
					name: holiday.name,
					date: new Date(holiday.date),
					description: holiday.description,
				});
			}
		}

		return events.sort((a, b) => a.date.getTime() - b.date.getTime());
	},
});

// Daily cron job to send reminder emails
export const sendReminderEmails = internalAction({
	args: {},
	async handler(ctx) {
		const users = await ctx.runQuery(internal.users.listUsers);

		for (const user of users) {
			// Skip if user doesn't have notification settings
			if (!user.settings?.notifications) continue;

			const { reminderDays, emailReminders } = user.settings.notifications;

			// Skip if no reminders are enabled
			if (
				!emailReminders.events &&
				!emailReminders.birthdays &&
				!emailReminders.holidays
			) {
				continue;
			}

			const now = new Date();
			const targetDate = new Date(
				now.getTime() + reminderDays * 24 * 60 * 60 * 1000
			);
			// Set the time to midnight UTC for consistent comparison
			targetDate.setUTCHours(0, 0, 0, 0);

			const upcomingEvents = await ctx.runQuery(
				internal.emails.getUpcomingEvents,
				{
					userId: user._id,
					startDate: targetDate.getTime(),
					endDate: targetDate.getTime() + 24 * 60 * 60 * 1000 - 1, // End of the target day
					includeEvents: emailReminders.events,
					includeBirthdays: emailReminders.birthdays,
					includeHolidays: emailReminders.holidays,
				}
			);

			// Skip if no upcoming events
			if (upcomingEvents.length === 0) continue;

			try {
				await resend.emails.send({
					from: "EventPulse <onboarding@resend.dev>",
					to: user.email,
					subject: `Events happening in ${reminderDays} days`,
					html: getReminderEmailHtml({
						userName: user.name,
						events: upcomingEvents,
					}),
				});
			} catch (error) {
				console.error(`Failed to send reminder email to ${user.email}:`, error);
			}
		}
	},
});
