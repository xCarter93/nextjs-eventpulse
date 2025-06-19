import { z } from "zod";
import { tool } from "ai";
import { createEvent, parseDate } from "../server-actions";
import { ConvexHttpClient } from "convex/browser";
import {
	logError,
	logToolCall,
	LogLevel,
	LogCategory,
	logAI,
} from "../logging";

// Simplified validation schemas - match actual database schema
const eventSchema = z.object({
	name: z
		.string()
		.min(1, "Event name is required")
		.max(100, "Event name is too long"),
	date: z
		.string()
		.describe(
			"Event date in any format (e.g., '06/25/2025', 'June 25, 2025', 'next Tuesday')"
		),
	isRecurring: z
		.boolean()
		.default(false)
		.describe("Whether the event recurs annually"),
});

// Utility functions
const sanitizeInput = (input: string): string => {
	return input.trim().replace(/[<>\"'&]/g, "");
};

const validateEventYear = (year: number): boolean => {
	const currentYear = new Date().getFullYear();
	return year >= currentYear && year <= currentYear + 10;
};

const parseEventDate = (dateInput: string): number => {
	const cleanDate = sanitizeInput(dateInput);
	const now = new Date();
	const currentYear = now.getFullYear();

	logAI(LogLevel.DEBUG, LogCategory.DATE_PARSING, "processing_event_date", {
		input: cleanDate,
	});

	// Try parseDate first (handles natural language)
	try {
		const timestamp = parseDate(cleanDate);
		const dateObj = new Date(timestamp);

		if (isNaN(dateObj.getTime())) {
			throw new Error("Invalid timestamp from parseDate");
		}

		const year = dateObj.getFullYear();

		// If the parsed year is in the past (like 2023), adjust to current year or next year
		if (year < currentYear) {
			const adjustedDate = new Date(dateObj);
			adjustedDate.setFullYear(currentYear + 1); // Set to next year

			logAI(LogLevel.DEBUG, LogCategory.DATE_PARSING, "adjusted_past_year", {
				original: dateObj.toISOString(),
				adjusted: adjustedDate.toISOString(),
			});

			return adjustedDate.getTime();
		}

		if (!validateEventYear(year)) {
			throw new Error(
				`The year ${year} seems unusual. Please provide a date between ${currentYear} and ${currentYear + 10}.`
			);
		}

		return timestamp;
	} catch (parseError) {
		logAI(LogLevel.DEBUG, LogCategory.DATE_PARSING, "parse_date_failed", {
			input: cleanDate,
			error: String(parseError),
		});
	}

	// Try MM/DD/YYYY format
	const parts = cleanDate.split("/");
	if (parts.length === 3) {
		const month = parseInt(parts[0], 10);
		const day = parseInt(parts[1], 10);
		let year = parseInt(parts[2], 10);

		// Handle 2-digit years by assuming they're in the 2000s
		if (year < 100) {
			year += 2000;
		}

		if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
			const dateObj = new Date(year, month - 1, day);

			// Verify the date is valid
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

	// Try MM/DD format (assume current year or next year if date has passed)
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

			// Verify the date is valid
			if (dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
				throw new Error(`Invalid date: ${month}/${day} does not exist.`);
			}

			return dateObj.getTime();
		}
	}

	// Try standard date parsing as fallback
	const parsedDate = new Date(cleanDate);
	if (!isNaN(parsedDate.getTime())) {
		let year = parsedDate.getFullYear();

		// If parsed year is in the past, adjust to current or next year
		if (year < currentYear) {
			parsedDate.setFullYear(currentYear + 1);
			year = currentYear + 1;
		}

		if (!validateEventYear(year)) {
			throw new Error(
				`The year ${year} seems unusual. Please provide a date between ${currentYear} and ${currentYear + 10}.`
			);
		}
		return parsedDate.getTime();
	}

	throw new Error(
		`I couldn't understand the date format. Please provide the date in a clear format like "MM/DD/YYYY" (e.g., 06/25/2025) or a natural description like "June 25, 2025", "next Tuesday", "two weeks from today", or "in 3 months".`
	);
};

const formatEventDate = (timestamp: number): string => {
	const date = new Date(timestamp);
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

/**
 * Simplified tool for creating events - matches database schema exactly
 */
export const createEventTool = tool({
	description:
		"Create a new event. Only requires event name and date. Do not ask for location or description as these are not stored.",
	parameters: z.object({
		name: z.string().describe("The event name"),
		date: z.string().describe("The event date in any format"),
		isRecurring: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Whether the event recurs annually (optional, defaults to false)"
			),
	}),
	execute: async ({ name, date, isRecurring = false }) => {
		try {
			logToolCall("createEventTool", "execute", {
				name: name ? `[${name.length} chars]` : "empty",
				date: date ? `[${date.length} chars]` : "empty",
				isRecurring,
			});

			// Validate required fields
			if (!name || !name.trim()) {
				throw new Error(
					"Event name is required. Please provide the event name."
				);
			}

			if (!date || !date.trim()) {
				throw new Error(
					"Event date is required. Please provide the event date."
				);
			}

			// Sanitize inputs
			const sanitizedName = sanitizeInput(name);
			const sanitizedDate = sanitizeInput(date);

			// Validate event name
			try {
				eventSchema.shape.name.parse(sanitizedName);
			} catch (error) {
				if (error instanceof z.ZodError) {
					throw new Error(error.errors[0]?.message || "Invalid event name");
				}
				throw error;
			}

			// Parse and validate date
			const dateTimestamp = parseEventDate(sanitizedDate);

			// Setup Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);

			// Create the event
			logAI(LogLevel.INFO, LogCategory.EVENT, "calling_create_event", {
				name: sanitizedName,
				date: dateTimestamp,
				isRecurring,
				formattedDate: formatEventDate(dateTimestamp),
			});

			const result = await createEvent(convex, {
				name: sanitizedName,
				date: dateTimestamp,
				isRecurring,
			});

			if (!result.success) {
				logAI(LogLevel.ERROR, LogCategory.EVENT, "create_event_error", {
					error: result.error,
				});

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

				throw new Error(result.error || "Unknown error creating event");
			}

			return {
				success: true,
				message: `✅ Successfully created event **${sanitizedName}** on ${formatEventDate(dateTimestamp)}${isRecurring ? " that will recur annually" : ""}! It's been added to your calendar.`,
				eventDetails: {
					id: result.eventId,
					name: sanitizedName,
					date: formatEventDate(dateTimestamp),
					isRecurring,
				},
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "create_event_error", error);

			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";

			// Provide helpful error responses
			if (errorMessage.includes("authentication")) {
				throw new Error(
					"You need to be logged in to create events. Please log in and try again."
				);
			}

			if (errorMessage.includes("date") || errorMessage.includes("timestamp")) {
				throw new Error(`Date parsing error: ${errorMessage}`);
			}

			throw new Error(errorMessage);
		}
	},
});

/**
 * Helper tool for asking users for missing event information - simplified
 */
export const askForEventInfoTool = tool({
	description:
		"Ask the user for missing event information when creating an event",
	parameters: z.object({
		missingField: z
			.enum(["name", "date", "recurrence"])
			.describe("Which field is missing"),
		partialInfo: z
			.object({
				name: z.string().optional(),
				date: z.string().optional(),
				isRecurring: z.boolean().optional(),
			})
			.describe("Any event information already collected"),
	}),
	execute: async ({ missingField, partialInfo }) => {
		const prompts = {
			name: "What's the name of the event?",
			date: "When is the event? You can provide the date in any format (e.g., '06/25/2025', 'June 25, 2025', 'next Tuesday', 'two weeks from today').",
			recurrence: "Should this event recur annually? (yes/no)",
		};

		let message = prompts[missingField];

		// Add context if we have partial info
		if (partialInfo.name) {
			message += `\n\nEvent name: ${partialInfo.name}`;
		}
		if (partialInfo.date) {
			message += `\nEvent date: ${partialInfo.date}`;
		}

		return {
			message,
			partialInfo,
			nextStep: missingField,
		};
	},
});
