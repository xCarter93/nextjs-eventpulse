import * as z from "zod";
import { Id } from "../../convex/_generated/dataModel";

// Email component schemas
const baseEmailComponent = z.object({
	id: z.string(),
	type: z.enum(["heading", "text", "button", "image"]),
});

const headingComponent = baseEmailComponent.extend({
	type: z.literal("heading"),
	content: z.string(),
});

const textComponent = baseEmailComponent.extend({
	type: z.literal("text"),
	content: z.string(),
});

const buttonComponent = baseEmailComponent.extend({
	type: z.literal("button"),
	content: z.string(),
	url: z.string(),
});

const imageComponent = baseEmailComponent.extend({
	type: z.literal("image"),
	url: z.string(),
	alt: z.string(),
});

const emailComponentSchema = z.discriminatedUnion("type", [
	headingComponent,
	textComponent,
	buttonComponent,
	imageComponent,
]);

export const recipientsSchema = z.object({
	recipients: z
		.array(z.custom<Id<"recipients">>())
		.min(1, "Select at least one recipient"),
});

// TODO: IMPORTANT - Restore .min(1, "Select at least one recipient") after testing

export const emailContentSchema = z.object({
	subject: z.string().min(1, "Subject is required"),
	scheduledDate: z.string().min(1, "Send date is required"),
	components: z.array(emailComponentSchema),
});

export const colorSchemeSchema = z.object({
	colorScheme: z.object({
		primary: z.string(),
		secondary: z.string(),
		accent: z.string(),
		background: z.string(),
	}),
});

export const scheduledEmailFormSchema = recipientsSchema
	.merge(emailContentSchema)
	.merge(colorSchemeSchema);
