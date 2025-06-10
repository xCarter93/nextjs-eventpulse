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

// Simplified validation schemas
const eventSchema = z.object({
	name: z
		.string()
		.min(1, "Event name is required")
		.max(100, "Event name is too long"),
	date: z
		.string()
		.describe(
			"Event date in any format (e.g., '03/18/2025', 'March 18, 2025', 'next Tuesday')"
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
		if (!validateEventYear(year)) {
			throw new Error(
				`The year ${year} seems unusual. Please provide a date between ${new Date().getFullYear()} and ${new Date().getFullYear() + 10}.`
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
		const year = parseInt(parts[2], 10);

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
					`The year ${year} seems unusual. Please provide a date between ${new Date().getFullYear()} and ${new Date().getFullYear() + 10}.`
				);
			}

			return dateObj.getTime();
		}
	}

	// Try standard date parsing as fallback
	const parsedDate = new Date(cleanDate);
	if (!isNaN(parsedDate.getTime())) {
		const year = parsedDate.getFullYear();
		if (!validateEventYear(year)) {
			throw new Error(
				`The year ${year} seems unusual. Please provide a date between ${new Date().getFullYear()} and ${new Date().getFullYear() + 10}.`
			);
		}
		return parsedDate.getTime();
	}

	throw new Error(
		`I couldn't understand the date format. Please provide the date in a clear format like "MM/DD/YYYY" (e.g., 03/18/2025) or a natural description like "March 18, 2025", "next Tuesday", "two weeks from today", or "in 3 months".`
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
 * Simplified tool for creating events - lets the AI SDK handle multi-step flows naturally
 */
export const createEventTool = tool({
	description:
		"Create a new event with name, date, and optional recurrence. If any information is missing, ask the user for it.",
	parameters: z.object({
		name: z.string().describe("The event name"),
		date: z.string().describe("The event date in any format"),
		isRecurring: z
			.boolean()
			.optional()
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
 * Helper tool for asking users for missing event information
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
			date: "When is the event? You can provide the date in any format (e.g., '03/18/2025', 'March 18, 2025', 'next Tuesday', 'two weeks from today').",
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
