import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
	createEvent,
	parseDate,
	getUpcomingEvents,
} from "@/utils/server-actions";
import { ConvexHttpClient } from "convex/browser";
import {
	logError,
	logToolCall,
	LogLevel,
	LogCategory,
	logAI,
} from "@/utils/logging";

// Validation schemas
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
 * Create a new event tool
 */
export const createEventTool = createTool({
	id: "create-event",
	description:
		"Create a new event ONLY when you have explicitly confirmed the event name, date, and recurrence preference with the user. Do NOT call this tool if any required information is missing - ask the user for the missing details first.",
	inputSchema: z.object({
		name: z.string().describe("The event name (must be provided by user)"),
		date: z
			.string()
			.describe("The event date in any format (must be provided by user)"),
		isRecurring: z
			.boolean()
			.optional()
			.describe(
				"Whether the event recurs annually (optional, defaults to false)"
			),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
		eventDetails: z
			.object({
				id: z.string(),
				name: z.string(),
				date: z.string(),
				isRecurring: z.boolean(),
			})
			.optional(),
	}),
	execute: async ({ context }) => {
		const { name, date, isRecurring = false } = context;

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

			const formattedDate = formatEventDate(dateTimestamp);
			const recurringText = isRecurring ? " (recurring annually)" : "";

			return {
				success: true,
				message: `✅ Successfully created event **${sanitizedName}** for ${formattedDate}${recurringText}! The event has been added to your calendar.`,
				eventDetails: {
					id: result.eventId || "unknown",
					name: sanitizedName,
					date: formattedDate,
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

			if (errorMessage.includes("date")) {
				throw new Error(`Date parsing error: ${errorMessage}`);
			}

			throw new Error(`Failed to create event: ${errorMessage}`);
		}
	},
});

/**
 * Get upcoming events tool
 */
export const getUpcomingEventsTool = createTool({
	id: "get-upcoming-events",
	description:
		"Fetch upcoming events with optional filtering by timeframe, event type, or search terms",
	inputSchema: z.object({
		limit: z
			.number()
			.optional()
			.default(10)
			.describe("Maximum number of events to return"),
		timeframe: z
			.enum(["week", "month", "quarter", "year", "all"])
			.optional()
			.default("month")
			.describe("Time period to fetch events for"),
		searchTerm: z
			.string()
			.optional()
			.describe("Search term to filter events by name"),
		includeRecurring: z
			.boolean()
			.optional()
			.default(true)
			.describe("Whether to include recurring events"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		events: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				date: z.string(),
				formattedDate: z.string(),
				isRecurring: z.boolean(),
				daysUntil: z.number(),
			})
		),
		summary: z.string(),
	}),
	execute: async ({ context }) => {
		const { limit, timeframe, searchTerm, includeRecurring } = context;

		try {
			logToolCall("getUpcomingEventsTool", "execute", {
				limit,
				timeframe,
				searchTerm: searchTerm ? `[${searchTerm.length} chars]` : "none",
				includeRecurring,
			});

			// Setup Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);

			// Calculate date range based on timeframe
			const startDate = new Date().toISOString().split("T")[0];
			let endDate: string;

			switch (timeframe) {
				case "week":
					const weekEnd = new Date();
					weekEnd.setDate(weekEnd.getDate() + 7);
					endDate = weekEnd.toISOString().split("T")[0];
					break;
				case "quarter":
					const quarterEnd = new Date();
					quarterEnd.setMonth(quarterEnd.getMonth() + 3);
					endDate = quarterEnd.toISOString().split("T")[0];
					break;
				case "year":
					const yearEnd = new Date();
					yearEnd.setFullYear(yearEnd.getFullYear() + 1);
					endDate = yearEnd.toISOString().split("T")[0];
					break;
				case "all":
					const allEnd = new Date();
					allEnd.setFullYear(allEnd.getFullYear() + 10);
					endDate = allEnd.toISOString().split("T")[0];
					break;
				default: // month
					const monthEnd = new Date();
					monthEnd.setMonth(monthEnd.getMonth() + 1);
					endDate = monthEnd.toISOString().split("T")[0];
			}

			// Get events using server action
			const result = await getUpcomingEvents(convex, {
				startDate,
				endDate,
				includeBirthdays: includeRecurring,
				includeEvents: true,
			});

			if (!result.success) {
				throw new Error(result.error || "Failed to fetch upcoming events");
			}

			const events = (result.events || [])
				.filter((event) => {
					// Apply search term filtering if provided
					if (searchTerm) {
						const searchLower = searchTerm.toLowerCase();
						return event.name.toLowerCase().includes(searchLower);
					}
					return true;
				})
				.slice(0, limit)
				.map((event, index) => ({
					id: `event-${index}`,
					name: event.name,
					date: new Date(event.timestamp).toISOString(),
					formattedDate: formatEventDate(event.timestamp),
					isRecurring: event.type === "birthday" || false,
					daysUntil: Math.ceil(
						(event.timestamp - Date.now()) / (1000 * 60 * 60 * 24)
					),
				}));

			const summary = `Found ${events.length} upcoming events in the next ${timeframe}${searchTerm ? ` matching "${searchTerm}"` : ""}`;

			return {
				success: true,
				events,
				summary,
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "get_upcoming_events_error", error);

			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";

			throw new Error(`Failed to fetch upcoming events: ${errorMessage}`);
		}
	},
});
