import { Resend } from "resend";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

export const sendScheduledEmail = internalAction({
	args: {
		recipientId: v.id("recipients"),
		date: v.number(),
		customMessage: v.optional(v.string()),
		subject: v.optional(v.string()),
		animationId: v.optional(v.id("animations")),
		animationUrl: v.optional(v.string()),
	},
	async handler(ctx, args) {
		console.log("Starting email send process", { args });

		const recipient = await ctx.runQuery(internal.recipients.getRecipient, {
			id: args.recipientId,
		});

		console.log("Recipient data:", { recipient });

		if (!recipient) {
			console.log("Skipping email - recipient not found", {
				recipientFound: false,
			});
			return;
		}

		// Only check sendAutomaticEmail for automated birthday emails
		if (!args.customMessage && !recipient.sendAutomaticEmail) {
			console.log(
				"Skipping automated birthday email - automated emails disabled",
				{
					sendAutomaticEmail: recipient.sendAutomaticEmail,
				}
			);
			return;
		}

		// Get the animation URL - either from storage or direct URL
		let animationUrl = args.animationUrl;
		if (!animationUrl && args.animationId) {
			// For custom emails, use the specified animation
			console.log("Getting custom animation", {
				animationId: args.animationId,
			});
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
			console.log("Getting random base animation");
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

		console.log("Animation URL:", { animationUrl });

		// Create the email content
		const subject = args.subject || `Happy Birthday ${recipient.name}!`;
		const message =
			args.customMessage ||
			`Wishing you a fantastic birthday filled with joy and celebration!`;

		console.log("Email content prepared:", { subject, message });

		try {
			console.log("Attempting to send email via Resend", {
				to: recipient.email,
				from: "EventPulse <notifications@eventpulse.com>",
				subject,
			});

			// Send the email using Resend
			const resend = new Resend(process.env.RESEND_API_KEY);
			const result = await resend.emails.send({
				from: "EventPulse <notifications@eventpulse.com>",
				to: recipient.email,
				subject: subject,
				html: `
					<!DOCTYPE html>
					<html>
						<head>
							<meta charset="utf-8">
							<meta name="viewport" content="width=device-width, initial-scale=1.0">
							<title>${subject}</title>
						</head>
						<body style="background-color: #f9fafb; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
							<div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
								<h1 style="color: #111827; font-size: 24px; font-weight: 600; line-height: 32px; margin: 0 0 20px; text-align: center;">
									${subject}
								</h1>
								<div style="text-align: center; margin: 20px 0;">
									<img src="${animationUrl}" alt="Animation" style="max-width: 400px; width: 100%; height: auto; margin: 0 auto;">
								</div>
								<p style="color: #374151; font-size: 16px; line-height: 24px; margin: 20px 0; text-align: center;">
									${message}
								</p>
								<p style="color: #6b7280; font-size: 14px; margin: 20px 0 0; padding: 20px 0 0; border-top: 1px solid #e5e7eb; text-align: center;">
									Sent with ❤️ from EventPulse
								</p>
							</div>
						</body>
					</html>`,
			});

			console.log("Email sent successfully", { result });
		} catch (error) {
			console.error("Failed to send email:", error);
			throw error;
		}

		// If this was an automated birthday email, schedule the next one for next year
		if (!args.customMessage) {
			const nextYear = new Date(args.date);
			nextYear.setFullYear(nextYear.getFullYear() + 1);

			console.log("Scheduling next year's email", {
				nextDate: nextYear.toISOString(),
			});

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
