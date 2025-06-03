import { z } from "zod";
import { tool } from "ai";
import { createRecipient, parseDate } from "../server-actions";
import { ConvexHttpClient } from "convex/browser";
import { logError, logToolCall, LogCategory } from "../logging";

// Enhanced validation schemas
const StepEnum = z.enum([
	"start",
	"collect-name",
	"collect-email",
	"collect-birthday",
	"confirm",
	"submit",
]);

const EmailSchema = z.string().email("Please provide a valid email address");
const NameSchema = z
	.string()
	.min(1, "Name is required")
	.max(100, "Name is too long");
const SessionIdSchema = z.string().min(1, "Session ID is required");

// Enhanced error handling with specific error types
class ToolValidationError extends Error {
	constructor(
		message: string,
		public field: string,
		public step: string
	) {
		super(message);
		this.name = "ToolValidationError";
	}
}

class DateParsingError extends Error {
	constructor(
		message: string,
		public input: string
	) {
		super(message);
		this.name = "DateParsingError";
	}
}

// Utility functions
const sanitizeInput = (input: string): string => {
	return input.trim().replace(/[<>\"'&]/g, "");
};

const validateYear = (year: number): boolean => {
	const currentYear = new Date().getFullYear();
	return year >= 1900 && year <= currentYear;
};

// Dedicated birthday parsing function that ensures consistent date handling
const parseBirthdayToUTC = (birthday: string): number => {
	const cleanBirthday = sanitizeInput(birthday);

	// Try MM/DD/YYYY format first (most common for birthdays)
	const mmddyyyy = cleanBirthday.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (mmddyyyy) {
		const [, month, day, year] = mmddyyyy;
		const monthNum = parseInt(month) - 1; // 0-based months
		const dayNum = parseInt(day);
		const yearNum = parseInt(year);

		// Create date in local timezone to match how dates are typically interpreted
		const date = new Date(yearNum, monthNum, dayNum);

		// Validate the date components
		if (
			date.getMonth() !== monthNum ||
			date.getDate() !== dayNum ||
			date.getFullYear() !== yearNum
		) {
			throw new DateParsingError("Invalid date values", cleanBirthday);
		}

		if (!validateYear(yearNum)) {
			throw new DateParsingError(
				`The year ${yearNum} seems invalid. Please use a year between 1900 and ${new Date().getFullYear()}.`,
				cleanBirthday
			);
		}

		return date.getTime();
	}

	// Try to parse natural language dates (like "April 20, 1969")
	const parsedDate = new Date(cleanBirthday);
	if (!isNaN(parsedDate.getTime())) {
		// Use the parsed date as-is in local timezone
		if (!validateYear(parsedDate.getFullYear())) {
			throw new DateParsingError(
				`The year ${parsedDate.getFullYear()} seems invalid. Please use a year between 1900 and ${new Date().getFullYear()}.`,
				cleanBirthday
			);
		}

		return parsedDate.getTime();
	}

	throw new DateParsingError(
		"Could not parse date. Please use MM/DD/YYYY format or natural language like 'April 20, 1969'",
		cleanBirthday
	);
};

const parseBirthdayWithValidation = (birthday: string): number => {
	const cleanBirthday = sanitizeInput(birthday);

	try {
		return parseBirthdayToUTC(cleanBirthday);
	} catch (error) {
		// If our dedicated parser fails, try the general parseDate as fallback but handle errors properly
		try {
			const timestamp = parseDate(cleanBirthday);
			const date = new Date(timestamp);

			if (!validateYear(date.getFullYear())) {
				throw new DateParsingError(
					`The year ${date.getFullYear()} seems invalid. Please use a year between 1900 and ${new Date().getFullYear()}.`,
					cleanBirthday
				);
			}

			// Use the date as-is without UTC conversion for birthdays
			return date.getTime();
		} catch {
			// Re-throw the original error from our dedicated parser instead of using parseDate's error
			throw error;
		}
	}
};

/**
 * Optimized tool for creating a new recipient with enhanced error handling and validation
 */
export const optimizedCreateRecipientTool = tool({
	description:
		"Create a new recipient with comprehensive validation and error handling",
	parameters: z.object({
		step: StepEnum.describe(
			"The current step in the recipient creation process"
		),
		name: z.string().describe("The recipient's name"),
		email: z.string().describe("The recipient's email address"),
		birthday: z.string().describe("The recipient's birthday"),
		sessionId: SessionIdSchema.describe(
			"Session ID to track this specific tool flow"
		),
	}),
	execute: async ({ step, name, email, birthday, sessionId }) => {
		try {
			logToolCall("optimizedCreateRecipientTool", "execute", {
				step,
				name: name ? `[${name.length} chars]` : "empty",
				email: email ? `[${email.length} chars]` : "empty",
				birthday: birthday ? `[${birthday.length} chars]` : "empty",
				sessionId,
			});

			// Sanitize all inputs
			const sanitizedName = sanitizeInput(name);
			const sanitizedEmail = sanitizeInput(email);
			const sanitizedBirthday = sanitizeInput(birthday);

			switch (step) {
				case "start":
					return {
						status: "in_progress",
						message: "I'll help you create a new recipient. What's their name?",
						nextStep: "collect-name",
						sessionId,
					};

				case "collect-name":
					try {
						NameSchema.parse(sanitizedName);
						return {
							status: "in_progress",
							message: `Great! Now, what's ${sanitizedName}'s email address?`,
							nextStep: "collect-email",
							name: sanitizedName,
							sessionId,
						};
					} catch (error) {
						if (error instanceof z.ZodError) {
							throw new ToolValidationError(
								error.errors[0]?.message || "Invalid name",
								"name",
								step
							);
						}
						throw error;
					}

				case "collect-email":
					if (!sanitizedName) {
						throw new ToolValidationError(
							"Name is required first. Let's start over.",
							"name",
							"collect-name"
						);
					}

					try {
						EmailSchema.parse(sanitizedEmail);
						return {
							status: "in_progress",
							message: `Perfect! Now, when is ${sanitizedName}'s birthday? You can use formats like "04/20/1969" or "April 20, 1969".`,
							nextStep: "collect-birthday",
							name: sanitizedName,
							email: sanitizedEmail,
							sessionId,
						};
					} catch (error) {
						if (error instanceof z.ZodError) {
							throw new ToolValidationError(
								"Please provide a valid email address",
								"email",
								step
							);
						}
						throw error;
					}

				case "collect-birthday":
					if (!sanitizedName || !sanitizedEmail) {
						throw new ToolValidationError(
							"Missing information. Let's start over.",
							"name",
							"collect-name"
						);
					}

					try {
						const birthdayTimestamp =
							parseBirthdayWithValidation(sanitizedBirthday);
						const formattedDate = new Date(
							birthdayTimestamp
						).toLocaleDateString();

						return {
							status: "in_progress",
							message: `Perfect! Here's the summary:\n\n• **Name:** ${sanitizedName}\n• **Email:** ${sanitizedEmail}\n• **Birthday:** ${formattedDate}\n\nIs this information correct?`,
							nextStep: "confirm",
							name: sanitizedName,
							email: sanitizedEmail,
							birthday: birthdayTimestamp.toString(),
							sessionId,
						};
					} catch (error) {
						if (error instanceof DateParsingError) {
							throw new ToolValidationError(error.message, "birthday", step);
						}
						throw error;
					}

				case "confirm":
					if (!sanitizedName || !sanitizedEmail || !sanitizedBirthday) {
						throw new ToolValidationError(
							"Missing information. Let's start over.",
							"name",
							"collect-name"
						);
					}

					return {
						status: "in_progress",
						message: `Creating recipient for ${sanitizedName}...`,
						nextStep: "submit",
						name: sanitizedName,
						email: sanitizedEmail,
						birthday: sanitizedBirthday,
						sessionId,
					};

				case "submit":
					if (!sanitizedName || !sanitizedEmail || !sanitizedBirthday) {
						throw new ToolValidationError(
							"Missing information. Let's start over.",
							"name",
							"collect-name"
						);
					}

					try {
						const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
						if (!convexUrl) {
							throw new Error("Convex configuration error");
						}

						const convex = new ConvexHttpClient(convexUrl);

						// Parse birthday timestamp
						let birthdayTimestamp: number;
						const timestampValue = Number(sanitizedBirthday);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							birthdayTimestamp = timestampValue;
						} else {
							birthdayTimestamp =
								parseBirthdayWithValidation(sanitizedBirthday);
						}

						// Create recipient
						const result = await createRecipient(convex, {
							name: sanitizedName,
							email: sanitizedEmail,
							birthday: birthdayTimestamp,
						});

						if (!result.success) {
							if (
								result.error?.includes("authentication") ||
								result.error?.includes("logged in")
							) {
								throw new Error(
									"Authentication required. Please log in and try again."
								);
							}
							throw new Error(result.error || "Failed to create recipient");
						}

						return {
							status: "success",
							message: `✅ Successfully created recipient **${sanitizedName}**! They've been added to your contact list.`,
							recipientDetails: {
								id: result.recipientId,
								name: sanitizedName,
								email: sanitizedEmail,
								birthday: new Date(birthdayTimestamp).toLocaleDateString(),
							},
							sessionId,
						};
					} catch (error) {
						logError(
							LogCategory.TOOL_CALL,
							"create_recipient_submit_error",
							error
						);

						if (error instanceof Error) {
							if (error.message.includes("authentication")) {
								throw new ToolValidationError(
									"You need to be logged in to create recipients.",
									"auth",
									"start"
								);
							}
							if (
								error.message.includes("birthday") ||
								error.message.includes("date")
							) {
								throw new ToolValidationError(
									"There was an issue with the birthday format.",
									"birthday",
									"collect-birthday"
								);
							}
						}

						throw new Error(
							error instanceof Error ? error.message : "Unknown error occurred"
						);
					}

				default:
					throw new ToolValidationError(
						"Invalid step. Let's start over.",
						"step",
						"start"
					);
			}
		} catch (error) {
			logError(
				LogCategory.TOOL_CALL,
				"optimized_create_recipient_error",
				error
			);

			if (error instanceof ToolValidationError) {
				return {
					status: "error",
					message: error.message,
					nextStep: error.step,
					field: error.field,
					sessionId,
				};
			}

			return {
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
				nextStep: "start",
				sessionId,
			};
		}
	},
});
