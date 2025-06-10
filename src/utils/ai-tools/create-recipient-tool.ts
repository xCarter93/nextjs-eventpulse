import { z } from "zod";
import { tool } from "ai";
import { createRecipient } from "../server-actions";
import { ConvexHttpClient } from "convex/browser";
import { logError, logToolCall, LogCategory } from "../logging";

// Simplified validation schemas
const recipientSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	email: z.string().email("Please provide a valid email address"),
	birthday: z.string().optional().describe("Birthday in any format (optional)"),
});

// Utility functions
const sanitizeInput = (input: string): string => {
	return input.trim().replace(/[<>\"'&]/g, "");
};

const validateYear = (year: number): boolean => {
	const currentYear = new Date().getFullYear();
	return year >= 1900 && year <= currentYear;
};

const parseBirthday = (birthday: string): number => {
	const cleanBirthday = sanitizeInput(birthday);

	// Try MM/DD/YYYY format first
	const mmddyyyy = cleanBirthday.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (mmddyyyy) {
		const [, month, day, year] = mmddyyyy;
		const monthNum = parseInt(month) - 1; // 0-based months
		const dayNum = parseInt(day);
		const yearNum = parseInt(year);

		const date = new Date(yearNum, monthNum, dayNum);

		// Validate the date components
		if (
			date.getMonth() !== monthNum ||
			date.getDate() !== dayNum ||
			date.getFullYear() !== yearNum
		) {
			throw new Error("Invalid date values");
		}

		if (!validateYear(yearNum)) {
			throw new Error(
				`The year ${yearNum} seems invalid. Please use a year between 1900 and ${new Date().getFullYear()}.`
			);
		}

		return date.getTime();
	}

	// Try natural language parsing
	const parsedDate = new Date(cleanBirthday);
	if (!isNaN(parsedDate.getTime())) {
		if (!validateYear(parsedDate.getFullYear())) {
			throw new Error(
				`The year ${parsedDate.getFullYear()} seems invalid. Please use a year between 1900 and ${new Date().getFullYear()}.`
			);
		}
		return parsedDate.getTime();
	}

	throw new Error(
		"Could not parse birthday. Please use MM/DD/YYYY format or natural language like 'April 20, 1969'"
	);
};

/**
 * Simplified tool for creating recipients - lets the AI SDK handle multi-step flows naturally
 */
export const createRecipientTool = tool({
	description:
		"Create a new recipient/contact with name, email, and optional birthday. Ask the user for required information if missing.",
	parameters: z.object({
		name: z.string().describe("The recipient's name"),
		email: z.string().describe("The recipient's email address"),
		birthday: z
			.string()
			.optional()
			.describe("The recipient's birthday (optional, in any format)"),
	}),
	execute: async ({ name, email, birthday }) => {
		try {
			logToolCall("createRecipientTool", "execute", {
				name: name ? `[${name.length} chars]` : "empty",
				email: email ? `[${email.length} chars]` : "empty",
				birthday: birthday ? `[${birthday.length} chars]` : "empty",
			});

			// Validate required fields
			if (!name || !name.trim()) {
				throw new Error(
					"Recipient name is required. Please provide the recipient's name."
				);
			}

			if (!email || !email.trim()) {
				throw new Error(
					"Email address is required. Please provide the recipient's email address."
				);
			}

			// Sanitize inputs
			const sanitizedName = sanitizeInput(name);
			const sanitizedEmail = sanitizeInput(email);
			const sanitizedBirthday = birthday ? sanitizeInput(birthday) : undefined;

			// Validate inputs
			try {
				recipientSchema.shape.name.parse(sanitizedName);
				recipientSchema.shape.email.parse(sanitizedEmail);
			} catch (error) {
				if (error instanceof z.ZodError) {
					throw new Error(error.errors[0]?.message || "Invalid input");
				}
				throw error;
			}

			// Parse birthday if provided
			let birthdayTimestamp: number | undefined;
			if (sanitizedBirthday && sanitizedBirthday.trim()) {
				try {
					birthdayTimestamp = parseBirthday(sanitizedBirthday);
				} catch (error) {
					throw new Error(
						`Birthday parsing error: ${error instanceof Error ? error.message : "Invalid birthday format"}`
					);
				}
			}

			// Setup Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);

			// Create the recipient
			const result = await createRecipient(convex, {
				name: sanitizedName,
				email: sanitizedEmail,
				birthday: birthdayTimestamp || 0, // Use 0 as default for no birthday
			});

			if (!result.success) {
				if (
					result.error &&
					(result.error.includes("authentication") ||
						result.error.includes("logged in") ||
						result.error.includes("auth") ||
						result.error.includes("Not authenticated"))
				) {
					throw new Error(
						"Authentication required. Please log in and try again."
					);
				}

				throw new Error(result.error || "Unknown error creating recipient");
			}

			const birthdayText = birthdayTimestamp
				? ` with birthday on ${new Date(birthdayTimestamp).toLocaleDateString()}`
				: "";

			return {
				success: true,
				message: `✅ Successfully created recipient **${sanitizedName}** (${sanitizedEmail})${birthdayText}! They've been added to your contacts.`,
				recipientDetails: {
					id: result.recipientId,
					name: sanitizedName,
					email: sanitizedEmail,
					birthday: birthdayTimestamp
						? new Date(birthdayTimestamp).toLocaleDateString()
						: undefined,
				},
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "create_recipient_error", error);

			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";

			// Provide helpful error responses
			if (errorMessage.includes("authentication")) {
				throw new Error(
					"You need to be logged in to create recipients. Please log in and try again."
				);
			}

			if (errorMessage.includes("email")) {
				throw new Error(`Email validation error: ${errorMessage}`);
			}

			if (errorMessage.includes("birthday") || errorMessage.includes("date")) {
				throw new Error(`Birthday parsing error: ${errorMessage}`);
			}

			throw new Error(errorMessage);
		}
	},
});

/**
 * Helper tool for asking users for missing recipient information
 */
export const askForRecipientInfoTool = tool({
	description:
		"Ask the user for missing recipient information when creating a contact",
	parameters: z.object({
		missingField: z
			.enum(["name", "email", "birthday"])
			.describe("Which field is missing"),
		partialInfo: z
			.object({
				name: z.string().optional(),
				email: z.string().optional(),
				birthday: z.string().optional(),
			})
			.describe("Any recipient information already collected"),
	}),
	execute: async ({ missingField, partialInfo }) => {
		const prompts = {
			name: "What's the recipient's name?",
			email: "What's the recipient's email address?",
			birthday:
				"What's the recipient's birthday? (You can use any date format like 'MM/DD/YYYY' or 'April 20, 1969', or leave it blank)",
		};

		let message = prompts[missingField];

		// Add context if we have partial info
		if (partialInfo.name) {
			message += `\n\nRecipient name: ${partialInfo.name}`;
		}
		if (partialInfo.email) {
			message += `\nEmail: ${partialInfo.email}`;
		}
		if (partialInfo.birthday) {
			message += `\nBirthday: ${partialInfo.birthday}`;
		}

		return {
			message,
			partialInfo,
			nextStep: missingField,
		};
	},
});
