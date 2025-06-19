import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { createRecipient } from "../../utils/server-actions";

// Workflow input schema
const contactCreationInputSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Please provide a valid email address"),
	birthday: z.string().optional().describe("Birthday in any format (optional)"),
	additionalInfo: z
		.string()
		.optional()
		.describe("Additional context about the contact"),
});

// Step 1: Validate and sanitize contact data
const validateContactDataStep = createStep({
	id: "validate-contact-data",
	description: "Validates and sanitizes contact input data",
	inputSchema: contactCreationInputSchema,
	outputSchema: z.object({
		sanitizedName: z.string(),
		sanitizedEmail: z.string(),
		birthday: z.string().optional(),
		additionalInfo: z.string().optional(),
	}),
	execute: async ({ inputData }) => {
		const { name, email, birthday, additionalInfo } = inputData;

		const sanitizeInput = (input: string): string => {
			return input.trim().replace(/[<>"'&]/g, "");
		};

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

		// Basic validation
		if (!sanitizedName) {
			throw new Error("Contact name cannot be empty after sanitization");
		}

		if (sanitizedName.length > 100) {
			throw new Error("Contact name is too long (max 100 characters)");
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(sanitizedEmail)) {
			throw new Error("Please provide a valid email address");
		}

		return {
			sanitizedName,
			sanitizedEmail,
			birthday: sanitizedBirthday,
			additionalInfo,
		};
	},
});

// Step 2: Parse and validate birthday (if provided)
const parseBirthdayStep = createStep({
	id: "parse-birthday",
	description: "Parses and validates the birthday if provided",
	inputSchema: z.object({
		sanitizedName: z.string(),
		sanitizedEmail: z.string(),
		birthday: z.string().optional(),
		additionalInfo: z.string().optional(),
	}),
	outputSchema: z.object({
		sanitizedName: z.string(),
		sanitizedEmail: z.string(),
		birthdayTimestamp: z.number().optional(),
		formattedBirthday: z.string().optional(),
		additionalInfo: z.string().optional(),
	}),
	execute: async ({ inputData }) => {
		const { sanitizedName, sanitizedEmail, birthday, additionalInfo } =
			inputData;

		if (!birthday || !birthday.trim()) {
			return {
				sanitizedName,
				sanitizedEmail,
				birthdayTimestamp: undefined,
				formattedBirthday: undefined,
				additionalInfo,
			};
		}

		const validateYear = (year: number): boolean => {
			const currentYear = new Date().getFullYear();
			return year >= 1900 && year <= currentYear;
		};

		const parseBirthday = (birthday: string): number => {
			const cleanBirthday = birthday.trim();

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

		try {
			const birthdayTimestamp = parseBirthday(birthday);
			const formattedBirthday = new Date(birthdayTimestamp).toLocaleDateString(
				"en-US",
				{
					year: "numeric",
					month: "long",
					day: "numeric",
				}
			);

			return {
				sanitizedName,
				sanitizedEmail,
				birthdayTimestamp,
				formattedBirthday,
				additionalInfo,
			};
		} catch (error) {
			throw new Error(
				`Birthday parsing error: ${error instanceof Error ? error.message : "Invalid birthday format"}`
			);
		}
	},
});

// Step 3: Create the contact
const createContactStep = createStep({
	id: "create-contact",
	description: "Creates the contact in the database",
	inputSchema: z.object({
		sanitizedName: z.string(),
		sanitizedEmail: z.string(),
		birthdayTimestamp: z.number().optional(),
		formattedBirthday: z.string().optional(),
		additionalInfo: z.string().optional(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		recipientId: z.string().optional(),
		message: z.string(),
		contactDetails: z.object({
			name: z.string(),
			email: z.string(),
			birthday: z.string().optional(),
		}),
	}),
	execute: async ({ inputData }) => {
		const {
			sanitizedName,
			sanitizedEmail,
			birthdayTimestamp,
			formattedBirthday,
		} = inputData;

		try {
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

			const birthdayText = formattedBirthday
				? ` with birthday on ${formattedBirthday}`
				: "";
			const message = `✅ Successfully created recipient **${sanitizedName}** (${sanitizedEmail})${birthdayText}! They've been added to your contacts.`;

			return {
				success: true,
				recipientId: result.recipientId,
				message,
				contactDetails: {
					name: sanitizedName,
					email: sanitizedEmail,
					birthday: formattedBirthday,
				},
			};
		} catch (error) {
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

			return {
				success: false,
				message: `❌ Failed to create contact: ${errorMessage}`,
				contactDetails: {
					name: sanitizedName,
					email: sanitizedEmail,
					birthday: formattedBirthday,
				},
			};
		}
	},
});

// Create the workflow
export const contactCreationWorkflow = createWorkflow({
	id: "contact-creation-workflow",
	description:
		"Multi-step workflow for creating contacts with validation and error handling",
	inputSchema: contactCreationInputSchema,
	outputSchema: z.object({
		success: z.boolean(),
		recipientId: z.string().optional(),
		message: z.string(),
		contactDetails: z.object({
			name: z.string(),
			email: z.string(),
			birthday: z.string().optional(),
		}),
	}),
})
	.then(validateContactDataStep)
	.then(parseBirthdayStep)
	.then(createContactStep)
	.commit();
