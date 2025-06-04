import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { canScheduleForDate } from "../src/lib/permissions";
import { api } from "./_generated/api";
import {
	type EmailComponent,
	type ImageComponent,
} from "../src/types/email-components";

export const scheduleCustomEmail = mutation({
	args: {
		recipientIds: v.array(v.id("recipients")),
		scheduledDate: v.number(),
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
	async handler(ctx, args) {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		if (!identity.email) {
			throw new ConvexError("User email is required");
		}

		// Verify user has access to all recipients
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		// Get user's subscription level
		const subscriptionLevel = await ctx.runQuery(
			api.subscriptions.getUserSubscriptionLevel
		);

		// Check if user can schedule for this date
		if (!canScheduleForDate(new Date(args.scheduledDate), subscriptionLevel)) {
			throw new ConvexError(
				"Free users can only schedule emails up to 7 days in advance. Upgrade to Pro to schedule emails further ahead."
			);
		}

		// Verify access to all recipients and collect their emails
		const recipients = await Promise.all(
			args.recipientIds.map(async (recipientId) => {
				const recipient = await ctx.db.get(recipientId);
				if (!recipient || recipient.userId !== user._id) {
					throw new ConvexError(
						`Recipient not found or access denied: ${recipientId}`
					);
				}
				return recipient;
			})
		);

		// Validate image URLs in components
		const imageComponents = args.components.filter(
			(component): component is ImageComponent => component.type === "image"
		);
		for (const component of imageComponents) {
			// Skip validation for Convex storage URLs
			if (component.url.includes("convex.cloud")) continue;

			// Only validate external URLs
			if (!component.url.match(/\.(gif|jpe?g|png)$/i)) {
				throw new ConvexError("Invalid image URL format");
			}
		}

		// Schedule a single email for all recipients
		try {
			await ctx.scheduler.runAt(
				args.scheduledDate,
				internal.emails.sendScheduledEmail,
				{
					recipientIds: args.recipientIds,
					to: recipients.map((r) => r.email),
					subject: args.subject,
					components: args.components,
					colorScheme: args.colorScheme,
				}
			);
		} catch {
			throw new ConvexError("Failed to schedule email. Please try again.");
		}
	},
});

export const listScheduledEmails = query({
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

		// Get all scheduled emails
		const scheduledEmails = await ctx.db.system
			.query("_scheduled_functions")
			.filter((q) => q.eq(q.field("name"), "emails.js:sendScheduledEmail"))
			.collect();

		// Enrich emails with recipient details
		const enrichedEmails = await Promise.all(
			scheduledEmails.map(async (email) => {
				const args = email.args[0] as {
					recipientIds: Id<"recipients">[];
					to: string[];
					subject: string;
					components: EmailComponent[];
					colorScheme?: {
						primary: string;
						secondary: string;
						accent: string;
						background: string;
					};
				};

				// Skip if no recipientIds
				if (!args?.recipientIds?.length) {
					return null;
				}

				// Get all recipients
				const recipients = await Promise.all(
					args.recipientIds.map(async (id) => {
						const recipient = await ctx.db.get(id);
						return recipient;
					})
				);

				// Only include emails where at least one recipient belongs to this user
				if (!recipients.some((r) => r && r.userId === user._id)) {
					return null;
				}

				// Filter to only include recipients that belong to this user
				const userRecipients = recipients.filter(
					(r) => r && r.userId === user._id
				);

				const enrichedEmail = {
					_id: email._id,
					scheduledTime: email.scheduledTime,
					status: email.state.kind,
					completedTime: email.completedTime,
					recipients: userRecipients.map((r) => ({
						name: r!.name,
						email: r!.email,
					})),
					subject: args.subject,
					isAutomated: false,
					error: email.state.kind === "failed" ? email.state.error : undefined,
					components: args.components, // Include components for preview generation
					colorScheme: args.colorScheme, // Include color scheme
				};

				return enrichedEmail;
			})
		);

		// Filter out null values and sort by scheduled time (most recent first)
		const filteredEmails = enrichedEmails
			.filter((email): email is NonNullable<typeof email> => email !== null)
			.sort((a, b) => b.scheduledTime - a.scheduledTime);

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
			recipientIds: Id<"recipients">[];
			to: string[];
			subject: string;
			components: EmailComponent[];
			colorScheme?: {
				primary: string;
				secondary: string;
				accent: string;
				background: string;
			};
		};

		// Skip if no recipientIds
		if (!emailArgs?.recipientIds?.length) {
			throw new ConvexError("Invalid email format");
		}

		// Verify user has access to at least one recipient
		const hasAccess = await Promise.all(
			emailArgs.recipientIds.map(async (id) => {
				const recipient = await ctx.db.get(id);
				return recipient?.userId === user._id;
			})
		).then((results) => results.some(Boolean));

		if (!hasAccess) {
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
					recipientIds: Id<"recipients">[];
					to: string[];
					subject: string;
					components: EmailComponent[];
					colorScheme?: {
						primary: string;
						secondary: string;
						accent: string;
						background: string;
					};
				};

				if (emailArgs.recipientIds.includes(args.recipientId)) {
					await ctx.scheduler.cancel(email._id);
				}
			})
		);
	},
});
