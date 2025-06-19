import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { createRecipient } from "../../utils/server-actions";

// Initial workflow input schema - just to start the workflow
const contactCreationInputSchema = z.object({
	start: z
		.boolean()
		.default(true)
		.describe("Start the contact creation process"),
});

// Step 1: Ask for Name
const askForNameStep = createStep({
	id: "ask-for-name",
	description: "Ask the user for the contact's name",
	inputSchema: z.object({
		start: z.boolean().default(true),
	}),
	resumeSchema: z.object({
		name: z.string().min(1, "Name is required"),
	}),
	outputSchema: z.object({
		name: z.string(),
		message: z.string(),
	}),
	execute: async ({ resumeData, suspend }) => {
		// If we don't have resume data with the name, suspend and ask for it
		if (!resumeData?.name) {
			await suspend({
				message: "What is the contact's name?",
				field: "name",
				required: true,
			});
			// This return won't be reached, but TypeScript needs it
			return {
				name: "",
				message: "Waiting for name input...",
			};
		}

		// Validate and sanitize the name
		const name = resumeData.name.trim().replace(/[<>"'&]/g, "");

		if (!name) {
			throw new Error("Contact name cannot be empty after sanitization");
		}

		if (name.length > 100) {
			throw new Error("Contact name is too long (max 100 characters)");
		}

		return {
			name,
			message: `Great! The contact's name is: **${name}**`,
		};
	},
});

// Step 2: Ask for Email
const askForEmailStep = createStep({
	id: "ask-for-email",
	description: "Ask the user for the contact's email address",
	inputSchema: z.object({
		name: z.string(),
		message: z.string(),
	}),
	resumeSchema: z.object({
		email: z.string().email("Please provide a valid email address"),
	}),
	outputSchema: z.object({
		name: z.string(),
		email: z.string(),
		message: z.string(),
	}),
	execute: async ({ inputData, resumeData, suspend }) => {
		// If we don't have resume data with the email, suspend and ask for it
		if (!resumeData?.email) {
			await suspend({
				message: `Now, what is ${inputData.name}'s email address?`,
				field: "email",
				required: true,
			});
			// This return won't be reached, but TypeScript needs it
			return {
				name: inputData.name,
				email: "",
				message: "Waiting for email input...",
			};
		}

		// Validate and sanitize the email
		const email = resumeData.email.trim().replace(/[<>"'&]/g, "");

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new Error("Please provide a valid email address");
		}

		return {
			name: inputData.name,
			email,
			message: `Perfect! Email address: **${email}**`,
		};
	},
});

// Step 3: Ask for Birthday (Optional)
const askForBirthdayStep = createStep({
	id: "ask-for-birthday",
	description: "Ask the user for the contact's birthday (optional)",
	inputSchema: z.object({
		name: z.string(),
		email: z.string(),
		message: z.string(),
	}),
	resumeSchema: z.object({
		birthday: z
			.string()
			.optional()
			.describe(
				"Birthday in MM/DD/YYYY format or natural language, or 'skip' to skip"
			),
	}),
	outputSchema: z.object({
		name: z.string(),
		email: z.string(),
		birthday: z.string().optional(),
		birthdayTimestamp: z.number().optional(),
		message: z.string(),
	}),
	execute: async ({ inputData, resumeData, suspend }) => {
		// If we don't have resume data with the birthday, suspend and ask for it
		if (!resumeData?.birthday) {
			await suspend({
				message: `Finally, what is ${inputData.name}'s birthday? (You can enter MM/DD/YYYY format, natural language like "April 20, 1985", or type "skip" to skip this field)`,
				field: "birthday",
				required: false,
			});
			// This return won't be reached, but TypeScript needs it
			return {
				name: inputData.name,
				email: inputData.email,
				birthday: undefined,
				birthdayTimestamp: undefined,
				message: "Waiting for birthday input...",
			};
		}

		// If user wants to skip birthday
		if (
			resumeData.birthday?.toLowerCase().trim() === "skip" ||
			!resumeData.birthday?.trim()
		) {
			return {
				name: inputData.name,
				email: inputData.email,
				birthday: undefined,
				birthdayTimestamp: undefined,
				message: "No birthday provided - that's okay!",
			};
		}

		// Parse and validate birthday
		try {
			const cleanBirthday = resumeData.birthday.trim();

			const validateYear = (year: number): boolean => {
				const currentYear = new Date().getFullYear();
				return year >= 1900 && year <= currentYear;
			};

			const parseBirthday = (birthday: string): number => {
				// Try MM/DD/YYYY format first
				const mmddyyyy = birthday.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
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
				const parsedDate = new Date(birthday);
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

			const birthdayTimestamp = parseBirthday(cleanBirthday);
			const formattedBirthday = new Date(birthdayTimestamp).toLocaleDateString(
				"en-US",
				{
					year: "numeric",
					month: "long",
					day: "numeric",
				}
			);

			return {
				name: inputData.name,
				email: inputData.email,
				birthday: formattedBirthday,
				birthdayTimestamp,
				message: `Excellent! Birthday: **${formattedBirthday}**`,
			};
		} catch (error) {
			throw new Error(
				`Birthday parsing error: ${error instanceof Error ? error.message : "Invalid birthday format"}`
			);
		}
	},
});

// Step 4: Create the Contact
const createContactStep = createStep({
	id: "create-contact",
	description: "Creates the contact in the database",
	inputSchema: z.object({
		name: z.string(),
		email: z.string(),
		birthday: z.string().optional(),
		birthdayTimestamp: z.number().optional(),
		message: z.string(),
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
		const { name, email, birthdayTimestamp, birthday } = inputData;

		try {
			// Setup Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);

			// Create the recipient
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

				throw new Error(result.error || "Unknown error creating recipient");
			}

			const birthdayText = birthday ? ` with birthday on ${birthday}` : "";
			const message = `🎉 **Contact Created Successfully!**\n\n✅ **${name}** (${email})${birthdayText}\n\nThey've been added to your contacts and are ready to receive your event notifications!`;

			return {
				success: true,
				recipientId: result.recipientId,
				message,
				contactDetails: {
					name,
					email,
					birthday,
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
					name,
					email,
					birthday,
				},
			};
		}
	},
});

// Create the interactive workflow
export const contactCreationWorkflow = createWorkflow({
	id: "contact-creation-workflow",
	description:
		"Interactive step-by-step workflow for creating contacts - asks for name, email, and birthday one at a time",
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
	.then(askForNameStep)
	.then(askForEmailStep)
	.then(askForBirthdayStep)
	.then(createContactStep)
	.commit();
