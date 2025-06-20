import { createTool } from "@mastra/core/tools";
import { tool } from "ai";
import { z } from "zod";
import {
	createEvent,
	parseDate,
	getUpcomingEvents,
} from "@/utils/server-actions";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";
import {
	logError,
	logToolCall,
	LogLevel,
	LogCategory,
	logAI,
} from "@/utils/logging";

// Validation schemas - simplified to match actual database schema
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

	logAI(LogLevel.DEBUG, LogCategory.DATE_PARSING, "processing_event_date", {
		input: cleanDate,
	});

	// Get current date for relative date calculations
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

		// If the parsed year is in the past (like 2023), adjust to current year or next year
		if (year < currentYear) {
			// Check if this is a relative date that got parsed incorrectly
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
 * Create a new event tool - simplified to match actual database schema
 */
export const createEventTool = createTool({
	id: "create-event",
	description:
		"Create a new event. Only requires event name and date. Do not ask for location or description as these are not stored.",
	inputSchema: z.object({
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

			// Get the authentication token from Clerk
			const session = await auth();
			const token = await session.getToken({ template: "convex" });

			if (!token) {
				throw new Error(
					"Authentication required. Please log in to create events."
				);
			}

			// Setup Convex client with authentication
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);
			convex.setAuth(token);

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

			// Get the authentication token from Clerk
			const session = await auth();
			const token = await session.getToken({ template: "convex" });

			if (!token) {
				throw new Error(
					"Authentication required. Please log in to view upcoming events."
				);
			}

			// Setup Convex client with authentication
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);
			convex.setAuth(token);

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

			let events = result.events || [];

			// Apply search term filtering if provided
			if (searchTerm && searchTerm.trim() !== "") {
				const searchLower = searchTerm.toLowerCase();
				events = events.filter((event: { name: string; person?: string }) => {
					return (
						event.name.toLowerCase().includes(searchLower) ||
						(event.person && event.person.toLowerCase().includes(searchLower))
					);
				});
			}

			// Apply limit and format events
			const formattedEvents = events.slice(0, limit).map(
				(
					event: {
						timestamp: number;
						name: string;
						type?: string;
						person?: string;
					},
					index: number
				) => ({
					id: `event-${index}`,
					name: event.name,
					date: new Date(event.timestamp).toISOString(),
					formattedDate: formatEventDate(event.timestamp),
					isRecurring: event.type === "birthday" || false,
					daysUntil: Math.ceil(
						(event.timestamp - Date.now()) / (1000 * 60 * 60 * 24)
					),
				})
			);

			// Sort events by date
			formattedEvents.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
			);

			const summary = `Found ${formattedEvents.length} upcoming events in the next ${timeframe}${searchTerm ? ` matching "${searchTerm}"` : ""}`;

			return {
				success: true,
				events: formattedEvents,
				summary,
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "get_upcoming_events_error", error);

			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";

			// Provide helpful error responses
			if (errorMessage.includes("authentication")) {
				throw new Error(
					"You need to be logged in to view upcoming events. Please log in and try again."
				);
			}

			throw new Error(`Failed to fetch upcoming events: ${errorMessage}`);
		}
	},
});

/**
 * Step-by-step event creation tool - simplified approach using AI SDK
 */
export const createEventStepByStepTool = tool({
	description:
		"Create a new event through a step-by-step process. Ask the user for required information if missing: event name, date, and whether it's recurring.",
	parameters: z.object({
		name: z.string().optional().describe("The event name"),
		date: z.string().optional().describe("The event date in any format"),
		isRecurring: z
			.boolean()
			.optional()
			.describe("Whether the event recurs annually"),
	}),
	execute: async ({ name, date, isRecurring }) => {
		try {
			logToolCall("createEventStepByStepTool", "execute", {
				name: name ? `[${name.length} chars]` : "missing",
				date: date ? `[${date.length} chars]` : "missing",
				isRecurring:
					isRecurring !== undefined ? isRecurring.toString() : "missing",
			});

			// Check what information we have and what we need
			const missing = [];
			if (!name || !name.trim()) {
				missing.push("event name");
			}
			if (!date || !date.trim()) {
				missing.push("event date");
			}
			if (isRecurring === undefined) {
				missing.push("recurring preference");
			}

			// If we're missing information, ask for it
			if (missing.length > 0) {
				const missingField = missing[0];
				let message = "";
				let nextStep = "";

				if (missingField === "event name") {
					message = "What would you like to name this event?";
					nextStep = "Waiting for event name";
				} else if (missingField === "event date") {
					message = `Great! The event name is **${name}**. When is this event happening? (You can use formats like "MM/DD/YYYY", "next Friday", "December 25", etc.)`;
					nextStep = "Waiting for event date";
				} else if (missingField === "recurring preference") {
					message = `Perfect! Event: **${name}** on **${date}**. Is this a recurring event (happens annually)? Say "yes" for recurring or "no" for one-time event.`;
					nextStep = "Waiting for recurring preference";
				}

				return {
					success: false,
					message,
					nextStep,
					partialInfo: {
						name: name || undefined,
						date: date || undefined,
						isRecurring: isRecurring,
					},
					completed: false,
				};
			}

			// We have all the information, create the event
			const sanitizedName = sanitizeInput(name!);
			const sanitizedDate = sanitizeInput(date!);

			// Validate inputs
			try {
				eventSchema.shape.name.parse(sanitizedName);
				eventSchema.shape.date.parse(sanitizedDate);
			} catch (error) {
				if (error instanceof z.ZodError) {
					throw new Error(error.errors[0]?.message || "Invalid input");
				}
				throw error;
			}

			// Parse the date
			let eventTimestamp: number;
			try {
				eventTimestamp = parseEventDate(sanitizedDate);
			} catch (error) {
				throw new Error(
					`Date parsing error: ${error instanceof Error ? error.message : "Invalid date format"}`
				);
			}

			// Get the authentication token from Clerk
			const session = await auth();
			const token = await session.getToken({ template: "convex" });

			if (!token) {
				throw new Error(
					"Authentication required. Please log in to create events."
				);
			}

			// Setup Convex client with authentication
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);
			convex.setAuth(token);

			// Create the event
			const result = await createEvent(convex, {
				name: sanitizedName,
				date: eventTimestamp,
				isRecurring: isRecurring || false,
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

			const recurringText = isRecurring ? " (recurring annually)" : "";
			const formattedDate = formatEventDate(eventTimestamp);

			return {
				success: true,
				message: `✅ Successfully created event **${sanitizedName}** on **${formattedDate}**${recurringText}! It's been added to your calendar.`,
				eventDetails: {
					id: result.eventId,
					name: sanitizedName,
					date: formattedDate,
					isRecurring: isRecurring || false,
				},
				completed: true,
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "create_event_step_by_step_error", error);

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
			.enum(["name", "date", "recurring"])
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
			name: "What would you like to name this event?",
			date: "When is this event happening? (You can use any date format like 'MM/DD/YYYY' or 'next Friday')",
			recurring:
				"Is this a recurring event (happens annually)? Say 'yes' for recurring or 'no' for one-time event.",
		};

		let message = prompts[missingField];

		// Add context if we have partial info
		if (partialInfo.name) {
			message += `\n\nEvent name: ${partialInfo.name}`;
		}
		if (partialInfo.date) {
			message += `\nEvent date: ${partialInfo.date}`;
		}
		if (partialInfo.isRecurring !== undefined) {
			message += `\nRecurring: ${partialInfo.isRecurring ? "Yes" : "No"}`;
		}

		return {
			message,
			partialInfo,
			nextStep: missingField,
		};
	},
});
