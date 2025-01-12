import { Resend } from "resend";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import EmailTemplate from "../src/lib/email/EmailTemplate";
import { createElement } from "react";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

export const sendScheduledEmail = internalAction({
	args: {
		recipientId: v.id("recipients"),
		date: v.number(),
		customMessage: v.optional(v.string()),
		subject: v.optional(v.string()),
	},
	async handler(ctx, args) {
		const recipient = await ctx.runQuery(internal.recipients.getRecipient, {
			id: args.recipientId,
		});

		if (!recipient || !recipient.sendAutomaticEmail) {
			return;
		}

		// Get a random base animation
		const animation = await ctx.runQuery(internal.animations.getBaseAnimation);
		if (!animation) {
			return;
		}

		// Get the animation URL
		const animationUrl = await ctx.runQuery(
			internal.animations.getAnimationUrlInternal,
			{
				storageId: animation.storageId as Id<"_storage">,
			}
		);

		if (!animationUrl) {
			throw new ConvexError("Failed to get animation URL");
		}

		if (!animation.storageId) {
			throw new ConvexError("Animation has no storage ID");
		}

		// Create the email content
		const subject = args.subject || `Happy Birthday ${recipient.name}!`;
		const message =
			args.customMessage ||
			`Wishing you a fantastic birthday filled with joy and celebration!`;

		// Send the email using Resend
		const resend = new Resend(process.env.RESEND_API_KEY);
		await resend.emails.send({
			from: "AnimGreet <noreply@animgreet.com>",
			to: recipient.email,
			subject: subject,
			react: createElement(EmailTemplate, {
				heading: subject,
				animationUrl: animationUrl,
				bodyText: message,
			}),
		});

		// If this was an automated birthday email, schedule the next one for next year
		if (!args.customMessage) {
			const nextYear = new Date(args.date);
			nextYear.setFullYear(nextYear.getFullYear() + 1);

			await ctx.scheduler.runAt(
				nextYear.getTime(),
				internal.emails.sendScheduledEmail,
				{
					recipientId: args.recipientId,
					date: nextYear.getTime(),
				}
			);
		}
	},
});
