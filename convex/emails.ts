import { Resend } from "resend";
import {
	internalAction,
	internalMutation,
	internalQuery,
	MutationCtx,
	QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getCustomEmailHtml } from "../src/email-templates/CustomEmailTemplate";
import { getReminderEmailHtml } from "../src/email-templates/reminder";
import { type EmailComponent } from "../src/types/email-components";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to check if a URL is a Convex storage URL
function isConvexStorageUrl(url: string): boolean {
	return url.includes("convex.cloud");
}

// Helper function to extract storage ID from Convex URL
function getStorageIdFromUrl(url: string): Id<"_storage"> | null {
	const match = url.match(/\/storage\/([^/]+)/);
	return match ? (match[1] as Id<"_storage">) : null;
}

export const sendScheduledEmail = internalAction({
	args: {
		recipientIds: v.array(v.id("recipients")),
		to: v.array(v.string()),
		subject: v.string(),
		components: v.array(
			v.union(
				v.object({
					id: v.string(),
					type: v.literal("heading"),
					content: v.string(),
				}),
				v.object({
					id: v.string(),
					type: v.literal("text"),
					content: v.string(),
				}),
				v.object({
					id: v.string(),
					type: v.literal("button"),
					content: v.string(),
					url: v.string(),
				}),
				v.object({
					id: v.string(),
					type: v.literal("image"),
					url: v.string(),
					alt: v.string(),
				}),
				v.object({
					id: v.string(),
					type: v.literal("event"),
					eventId: v.optional(v.string()),
					eventType: v.union(v.literal("birthday"), v.literal("custom")),
					placeholderTitle: v.string(),
					placeholderDate: v.number(),
				}),
				v.object({
					id: v.string(),
					type: v.literal("divider"),
				}),
				v.object({
					id: v.string(),
					type: v.literal("audio"),
					audioUrl: v.optional(v.string()),
					title: v.string(),
					isRecorded: v.boolean(),
				})
			)
		),
		colorScheme: v.optional(
			v.object({
				primary: v.string(),
				secondary: v.string(),
				accent: v.string(),
				background: v.string(),
			})
		),
	},
	handler: async (ctx, args) => {
		try {
			// Create a new array of components with fresh URLs for Convex storage images and audio
			const updatedComponents = await Promise.all(
				args.components.map(async (component) => {
					if (component.type === "image" && isConvexStorageUrl(component.url)) {
						const storageId = getStorageIdFromUrl(component.url);
						if (storageId) {
							// Generate a fresh URL for the image
							const freshUrl = await ctx.storage.getUrl(storageId);
							return {
								...component,
								url: freshUrl,
							};
						}
					}

					if (
						component.type === "audio" &&
						component.audioUrl &&
						isConvexStorageUrl(component.audioUrl)
					) {
						const storageId = getStorageIdFromUrl(component.audioUrl);
						if (storageId) {
							// Generate a fresh URL for the audio
							const freshUrl = await ctx.storage.getUrl(storageId);
							return {
								...component,
								audioUrl: freshUrl,
							};
						}
					}

					return component;
				})
			);

			// Prepare attachments for audio files
			const attachments = [];
			for (const component of updatedComponents) {
				if (component.type === "audio" && component.audioUrl) {
					// Add to attachments using the path format
					attachments.push({
						path: component.audioUrl,
						filename: `${component.title || "Audio Message"}.mp3`,
					});
				}
			}

			const { data, error } = await resend.emails.send({
				from: "EventPulse <pulse@eventpulse.tech>",
				to: args.to,
				subject: args.subject,
				html: getCustomEmailHtml({
					components: updatedComponents as EmailComponent[],
					colorScheme: args.colorScheme,
				}),
				attachments: attachments.length > 0 ? attachments : undefined,
			});

			if (error) {
				console.error("Failed to send email:", error);
				throw new Error(`Failed to send email: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("Error sending email:", error);
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
			date: number;
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
						date: thisYearBirthday.getTime(),
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
						date: eventDate.getTime(),
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
					date: new Date(holiday.date).getTime(),
					description: holiday.description,
				});
			}
		}

		return events.sort((a, b) => a.date - b.date);
	},
});

// Internal action to send a single reminder email
export const sendReminderEmailAction = internalAction({
	args: {
		userId: v.id("users"),
		userEmail: v.string(),
		userName: v.string(),
		events: v.array(
			v.object({
				type: v.union(
					v.literal("birthday"),
					v.literal("event"),
					v.literal("holiday")
				),
				name: v.string(),
				date: v.number(),
				description: v.optional(v.string()),
			})
		),
		reminderDays: v.number(),
	},
	async handler(ctx, args) {
		await resend.emails.send({
			from: "EventPulse <pulse@eventpulse.tech>",
			to: args.userEmail,
			subject: `Events happening in ${args.reminderDays} days`,
			html: getReminderEmailHtml({
				userName: args.userName,
				events: args.events,
			}),
		});
	},
});

// Helper function to get and process events for a user
async function sendReminderEmail(
	ctx: {
		runQuery: QueryCtx["runQuery"];
		scheduler: MutationCtx["scheduler"];
	},
	user: {
		_id: Id<"users">;
		email: string;
		name: string;
		settings?: {
			notifications?: {
				reminderDays: number;
				emailReminders: {
					events: boolean;
					birthdays: boolean;
					holidays: boolean;
				};
			};
		};
	},
	delay: number
): Promise<void> {
	// Ensure user has required settings
	if (!user.settings?.notifications) return;

	const { reminderDays, emailReminders } = user.settings.notifications;

	// Calculate the date range for events
	const now = new Date();
	now.setUTCHours(0, 0, 0, 0);

	const targetStart = new Date(now);
	targetStart.setDate(targetStart.getDate() + reminderDays);
	targetStart.setUTCHours(0, 0, 0, 0);

	const targetEnd = new Date(targetStart);
	targetEnd.setUTCHours(23, 59, 59, 999);

	const upcomingEvents = await ctx.runQuery(internal.emails.getUpcomingEvents, {
		userId: user._id,
		startDate: targetStart.getTime(),
		endDate: targetEnd.getTime(),
		includeEvents: emailReminders.events,
		includeBirthdays: emailReminders.birthdays,
		includeHolidays: emailReminders.holidays,
	});

	// If no events, return early
	if (upcomingEvents.length === 0) return;

	// Schedule the email with the specified delay
	await ctx.scheduler.runAfter(delay, internal.emails.sendReminderEmailAction, {
		userId: user._id,
		userEmail: user.email,
		userName: user.name,
		events: upcomingEvents,
		reminderDays,
	});
	console.log(
		`Scheduled reminder email for ${user.email} with ${upcomingEvents.length} events`
	);
}

// Daily cron job to send reminder emails
export const sendReminderEmails = internalMutation({
	args: {},
	async handler(ctx) {
		const users = await ctx.runQuery(internal.users.listUsers);
		console.log(`Processing reminder emails for ${users.length} users`);

		// Filter users who have at least one notification type enabled
		const eligibleUsers = users.filter((user) => {
			if (!user.settings?.notifications) return false;
			const { emailReminders } = user.settings.notifications;
			return (
				emailReminders.events ||
				emailReminders.birthdays ||
				emailReminders.holidays
			);
		});

		// Process each eligible user with a delay
		await Promise.all(
			eligibleUsers.map(
				(user, index) => sendReminderEmail(ctx, user, index * 200) // 200ms delay between each email
			)
		);
		console.log(
			`Completed processing reminder emails for ${eligibleUsers.length} eligible users`
		);
	},
});
