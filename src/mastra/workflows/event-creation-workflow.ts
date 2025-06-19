import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { createEvent, parseDate } from "../../utils/server-actions";

// Workflow input schema
const eventCreationInputSchema = z.object({
	name: z.string().min(1, "Event name is required"),
	date: z.string().describe("Event date in any format"),
	isRecurring: z.boolean().default(false),
	additionalInfo: z
		.string()
		.optional()
		.describe("Additional context about the event"),
});

// Step 1: Validate and sanitize event data
const validateEventDataStep = createStep({
	id: "validate-event-data",
	description: "Validates and sanitizes event input data",
	inputSchema: eventCreationInputSchema,
	outputSchema: z.object({
		sanitizedName: z.string(),
		date: z.string(),
		isRecurring: z.boolean(),
		additionalInfo: z.string().optional(),
	}),
	execute: async ({ inputData }) => {
		const { name, date, isRecurring, additionalInfo } = inputData;

		// Sanitize input
		const sanitizedName = name.trim().replace(/[<>"'&]/g, "");

		// Basic validation
		if (!sanitizedName) {
			throw new Error("Event name cannot be empty after sanitization");
		}

		if (sanitizedName.length > 100) {
			throw new Error("Event name is too long (max 100 characters)");
		}

		return {
			sanitizedName,
			date,
			isRecurring,
			additionalInfo,
		};
	},
});

// Step 2: Parse and validate date
const parseDateStep = createStep({
	id: "parse-date",
	description: "Parses and validates the event date",
	inputSchema: z.object({
		sanitizedName: z.string(),
		date: z.string(),
		isRecurring: z.boolean(),
		additionalInfo: z.string().optional(),
	}),
	outputSchema: z.object({
		sanitizedName: z.string(),
		timestamp: z.number(),
		formattedDate: z.string(),
		isRecurring: z.boolean(),
		additionalInfo: z.string().optional(),
	}),
	execute: async ({ inputData }) => {
		const { sanitizedName, date, isRecurring, additionalInfo } = inputData;

		const sanitizeInput = (input: string): string => {
			return input.trim().replace(/[<>"'&]/g, "");
		};

		const validateEventYear = (year: number): boolean => {
			const currentYear = new Date().getFullYear();
			return year >= currentYear && year <= currentYear + 10;
		};

		const parseEventDate = (dateInput: string): number => {
			const cleanDate = sanitizeInput(dateInput);
			const now = new Date();
			const currentYear = now.getFullYear();

			// Try parseDate first (handles natural language)
			try {
				const timestamp = parseDate(cleanDate);
				const dateObj = new Date(timestamp);

				if (isNaN(dateObj.getTime())) {
					throw new Error("Invalid timestamp from parseDate");
				}

				const year = dateObj.getFullYear();

				// If the parsed year is in the past, adjust to current year or next year
				if (year < currentYear) {
					const adjustedDate = new Date(dateObj);
					adjustedDate.setFullYear(currentYear + 1);
					return adjustedDate.getTime();
				}

				if (!validateEventYear(year)) {
					throw new Error(
						`The year ${year} seems unusual. Please provide a date between ${currentYear} and ${currentYear + 10}.`
					);
				}

				return timestamp;
			} catch {
				// Try MM/DD/YYYY format
				const parts = cleanDate.split("/");
				if (parts.length === 3) {
					const month = parseInt(parts[0], 10);
					const day = parseInt(parts[1], 10);
					let year = parseInt(parts[2], 10);

					// Handle 2-digit years
					if (year < 100) {
						year += 2000;
					}

					if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
						const dateObj = new Date(year, month - 1, day);

						if (
							dateObj.getMonth() !== month - 1 ||
							dateObj.getDate() !== day ||
							dateObj.getFullYear() !== year
						) {
							throw new Error(
								`Invalid date: ${month}/${day}/${year} does not exist.`
							);
						}

						if (!validateEventYear(year)) {
							throw new Error(
								`The year ${year} seems unusual. Please provide a date between ${currentYear} and ${currentYear + 10}.`
							);
						}

						return dateObj.getTime();
					}
				}

				// Try MM/DD format
				if (parts.length === 2) {
					const month = parseInt(parts[0], 10);
					const day = parseInt(parts[1], 10);

					if (!isNaN(month) && !isNaN(day)) {
						let year = currentYear;
						const dateObj = new Date(year, month - 1, day);

						// If the date has already passed this year, use next year
						if (dateObj < now) {
							year = currentYear + 1;
							dateObj.setFullYear(year);
						}

						if (dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
							throw new Error(`Invalid date: ${month}/${day} does not exist.`);
						}

						return dateObj.getTime();
					}
				}

				throw new Error(
					`I couldn't understand the date format. Please provide the date in a clear format like "MM/DD/YYYY" or natural language like "June 25, 2025".`
				);
			}
		};

		try {
			const timestamp = parseEventDate(date);
			const formattedDate = new Date(timestamp).toLocaleDateString("en-US", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});

			return {
				sanitizedName,
				timestamp,
				formattedDate,
				isRecurring,
				additionalInfo,
			};
		} catch (error) {
			throw new Error(
				`Date parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	},
});

// Step 3: Create the event
const createEventStep = createStep({
	id: "create-event",
	description: "Creates the event in the database",
	inputSchema: z.object({
		sanitizedName: z.string(),
		timestamp: z.number(),
		formattedDate: z.string(),
		isRecurring: z.boolean(),
		additionalInfo: z.string().optional(),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		eventId: z.string().optional(),
		message: z.string(),
		eventDetails: z.object({
			name: z.string(),
			date: z.string(),
			isRecurring: z.boolean(),
		}),
	}),
	execute: async ({ inputData }) => {
		const { sanitizedName, timestamp, formattedDate, isRecurring } = inputData;

		try {
			// Setup Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);

			// Create the event
			const result = await createEvent(convex, {
				name: sanitizedName,
				date: timestamp,
				isRecurring,
			});

			if (!result.success) {
				throw new Error(result.error || "Unknown error creating event");
			}

			const recurringText = isRecurring ? " (recurring annually)" : "";
			const message = `✅ Successfully created event **${sanitizedName}** for ${formattedDate}${recurringText}!`;

			return {
				success: true,
				eventId: result.eventId,
				message,
				eventDetails: {
					name: sanitizedName,
					date: formattedDate,
					isRecurring,
				},
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";

			// Handle authentication errors
			if (
				errorMessage.includes("authentication") ||
				errorMessage.includes("logged in")
			) {
				throw new Error(
					"You need to be logged in to create events. Please log in and try again."
				);
			}

			return {
				success: false,
				message: `❌ Failed to create event: ${errorMessage}`,
				eventDetails: {
					name: sanitizedName,
					date: formattedDate,
					isRecurring,
				},
			};
		}
	},
});

// Create the workflow
export const eventCreationWorkflow = createWorkflow({
	id: "event-creation-workflow",
	description:
		"Multi-step workflow for creating events with validation and error handling",
	inputSchema: eventCreationInputSchema,
	outputSchema: z.object({
		success: z.boolean(),
		eventId: z.string().optional(),
		message: z.string(),
		eventDetails: z.object({
			name: z.string(),
			date: z.string(),
			isRecurring: z.boolean(),
		}),
	}),
})
	.then(validateEventDataStep)
	.then(parseDateStep)
	.then(createEventStep)
	.commit();
