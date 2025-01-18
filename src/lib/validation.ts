import * as z from "zod";
import { Id } from "../../convex/_generated/dataModel";

const baseRecipientsAnimationSchema = z.object({
	recipients: z
		.array(z.string().transform((val) => val as Id<"recipients">))
		.min(1, "Select at least one recipient"),
	animationType: z.enum(["uploaded", "url"]),
	animation: z.string().optional(),
	animationUrl: z.string().optional(),
});

export const recipientsAnimationSchema = baseRecipientsAnimationSchema.refine(
	(data) => {
		if (data.animationType === "uploaded") {
			return !!data.animation;
		} else {
			return (
				!!data.animationUrl && data.animationUrl.match(/\.(gif|jpe?g|png)$/i)
			);
		}
	},
	{
		message: "Please select an animation or enter a valid image URL",
		path: ["animation"],
	}
);

export const emailContentSchema = z.object({
	subject: z.string().min(1, "Enter a subject"),
	scheduledDate: z.string().min(1, "Select a date"),
	heading: z.string().min(1, "Enter a heading"),
	body: z.string().min(1, "Enter a message"),
});

export const colorSchemeSchema = z.object({
	colorScheme: z.object({
		primary: z.string(),
		secondary: z.string(),
		accent: z.string(),
		background: z.string(),
	}),
});

// Merge all schemas into one
export const scheduledEmailFormSchema = z
	.object({
		...baseRecipientsAnimationSchema.shape,
		...emailContentSchema.shape,
		...colorSchemeSchema.shape,
	})
	.refine(
		(data) => {
			if (data.animationType === "uploaded") {
				return !!data.animation;
			} else {
				return (
					!!data.animationUrl && data.animationUrl.match(/\.(gif|jpe?g|png)$/i)
				);
			}
		},
		{
			message: "Please select an animation or enter a valid image URL",
			path: ["animation"],
		}
	);
