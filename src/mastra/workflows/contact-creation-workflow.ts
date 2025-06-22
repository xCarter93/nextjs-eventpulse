import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { createRecipient } from "@/utils/server-actions";
import { ConvexHttpClient } from "convex/browser";

// Input schema for the workflow
const contactCreationInputSchema = z.object({
	name: z.string().min(1, "Contact name is required"),
	email: z.string().email("Valid email address is required"),
	birthday: z.string().optional().describe("Birthday in any format (optional)"),
});

// Output schema for the workflow
const contactCreationOutputSchema = z.object({
	success: z.boolean(),
	contactId: z.string().optional(),
	message: z.string(),
	contactDetails: z.object({
		name: z.string(),
		email: z.string(),
		birthday: z.string().optional(),
	}),
});

// Step 1: Validate and sanitize contact data
const validateContactDataStep = createStep({
	id: "validate-contact-data",
	description: "Validate and sanitize contact information",
	inputSchema: contactCreationInputSchema,
	outputSchema: z.object({
		name: z.string(),
		email: z.string(),
		birthday: z.string().optional(),
		validationMessage: z.string(),
	}),
	execute: async ({ inputData }) => {
		const { name, email, birthday } = inputData;

		// Sanitize inputs
		const sanitizedName = name.trim().replace(/[<>\"'&]/g, "");
		const sanitizedEmail = email
			.trim()
			.toLowerCase()
			.replace(/[<>\"'&]/g, "");
		const sanitizedBirthday = birthday?.trim().replace(/[<>\"'&]/g, "");

		// Validate name
		if (!sanitizedName || sanitizedName.length < 1) {
			throw new Error("Contact name is required and cannot be empty");
		}

		if (sanitizedName.length > 100) {
			throw new Error("Contact name is too long (maximum 100 characters)");
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(sanitizedEmail)) {
			throw new Error("Please provide a valid email address format");
		}

		// Validate birthday if provided
		let birthdayValidation = "";
		if (sanitizedBirthday && sanitizedBirthday.length > 0) {
			try {
				const testDate = new Date(sanitizedBirthday);
				if (isNaN(testDate.getTime())) {
					birthdayValidation =
						"Note: Birthday format may need adjustment during parsing";
				} else {
					const currentYear = new Date().getFullYear();
					if (
						testDate.getFullYear() > currentYear ||
						testDate.getFullYear() < 1900
					) {
						birthdayValidation =
							"Note: Birthday year seems unusual, will be validated during parsing";
					}
				}
			} catch {
				birthdayValidation =
					"Note: Birthday format may need adjustment during parsing";
			}
		}

		return {
			name: sanitizedName,
			email: sanitizedEmail,
			birthday: sanitizedBirthday,
			validationMessage:
				birthdayValidation || "Contact data validated successfully",
		};
	},
});

// Step 2: Parse birthday if provided
const parseBirthdayStep = createStep({
	id: "parse-birthday",
	description: "Parse and validate birthday information",
	inputSchema: z.object({
		name: z.string(),
		email: z.string(),
		birthday: z.string().optional(),
		validationMessage: z.string(),
	}),
	outputSchema: z.object({
		name: z.string(),
		email: z.string(),
		birthdayTimestamp: z.number().optional(),
		birthdayFormatted: z.string().optional(),
		parseMessage: z.string(),
	}),
	execute: async ({ inputData }) => {
		const { name, email, birthday } = inputData;

		if (!birthday || birthday.trim().length === 0) {
			return {
				name,
				email,
				birthdayTimestamp: undefined,
				birthdayFormatted: undefined,
				parseMessage: "No birthday provided",
			};
		}

		try {
			const cleanBirthday = birthday.trim();

			// Try MM/DD/YYYY format first
			const mmddyyyy = cleanBirthday.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
			let parsedDate: Date;

			if (mmddyyyy) {
				const [, month, day, year] = mmddyyyy;
				const monthNum = parseInt(month) - 1; // 0-based months
				const dayNum = parseInt(day);
				const yearNum = parseInt(year);

				parsedDate = new Date(yearNum, monthNum, dayNum);

				// Validate the date components
				if (
					parsedDate.getMonth() !== monthNum ||
					parsedDate.getDate() !== dayNum ||
					parsedDate.getFullYear() !== yearNum
				) {
					throw new Error("Invalid date values");
				}
			} else {
				// Try natural language parsing
				parsedDate = new Date(cleanBirthday);
				if (isNaN(parsedDate.getTime())) {
					throw new Error("Unable to parse birthday format");
				}
			}

			// Validate year range
			const currentYear = new Date().getFullYear();
			if (
				parsedDate.getFullYear() < 1900 ||
				parsedDate.getFullYear() > currentYear
			) {
				throw new Error(
					`Birthday year ${parsedDate.getFullYear()} is outside valid range (1900-${currentYear})`
				);
			}

			const birthdayTimestamp = parsedDate.getTime();
			const birthdayFormatted = parsedDate.toLocaleDateString();

			return {
				name,
				email,
				birthdayTimestamp,
				birthdayFormatted,
				parseMessage: `Birthday parsed successfully: ${birthdayFormatted}`,
			};
		} catch (error) {
			throw new Error(
				`Birthday parsing error: ${
					error instanceof Error ? error.message : "Invalid birthday format"
				}. Please use MM/DD/YYYY format or natural language like 'April 20, 1985'`
			);
		}
	},
});

// Step 3: Create contact in database
const createContactStep = createStep({
	id: "create-contact",
	description: "Create contact in the Convex database",
	inputSchema: z.object({
		name: z.string(),
		email: z.string(),
		birthdayTimestamp: z.number().optional(),
		birthdayFormatted: z.string().optional(),
		parseMessage: z.string(),
	}),
	outputSchema: contactCreationOutputSchema,
	execute: async ({ inputData }) => {
		const { name, email, birthdayTimestamp, birthdayFormatted } = inputData;

		try {
			// Setup Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error(
					"Convex configuration error - missing NEXT_PUBLIC_CONVEX_URL"
				);
			}

			const convex = new ConvexHttpClient(convexUrl);

			// Create the contact
			const result = await createRecipient(convex, {
				name,
				email,
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

				throw new Error(result.error || "Unknown error creating contact");
			}

			const birthdayText = birthdayFormatted
				? ` with birthday on ${birthdayFormatted}`
				: "";

			return {
				success: true,
				contactId: result.recipientId || "unknown",
				message: `🎉 **Contact Created Successfully!**\n\n✅ **${name}** (${email})${birthdayText}\n\nThey've been added to your contacts and are ready to receive your event notifications!`,
				contactDetails: {
					name,
					email,
					birthday: birthdayFormatted,
				},
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			return {
				success: false,
				message: `❌ Failed to create contact: ${errorMessage}`,
				contactDetails: {
					name,
					email,
					birthday: birthdayFormatted,
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
	outputSchema: contactCreationOutputSchema,
})
	.then(validateContactDataStep)
	.then(parseBirthdayStep)
	.then(createContactStep)
	.commit();
