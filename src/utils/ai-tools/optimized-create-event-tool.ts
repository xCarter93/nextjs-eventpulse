import { z } from "zod";
import { tool } from "ai";
import { createEvent, parseDate } from "../server-actions";
import { ConvexHttpClient } from "convex/browser";
import {
	logAI,
	logError,
	logToolCall,
	LogLevel,
	LogCategory,
} from "../logging";
import { activeToolFlows } from "./state";

// Enhanced validation schemas
const StepEnum = z.enum([
	"start",
	"collect-name",
	"collect-date",
	"collect-recurring",
	"confirm",
	"submit",
]);

const EventNameSchema = z
	.string()
	.min(1, "Event name is required")
	.max(100, "Event name is too long");

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

class EventDateParsingError extends Error {
	constructor(
		message: string,
		public input: string
	) {
		super(message);
		this.name = "EventDateParsingError";
	}
}

// Utility functions
const sanitizeInput = (input: string): string => {
	return input.trim().replace(/[<>\"'&]/g, "");
};

const validateEventYear = (year: number): boolean => {
	const currentYear = new Date().getFullYear();
	return year >= currentYear && year <= currentYear + 10;
};

// Consolidated date parsing function to eliminate repetition
const parseEventDateWithValidation = (dateInput: string): number => {
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

		// Validate year
		const year = dateObj.getFullYear();
		if (!validateEventYear(year)) {
			throw new EventDateParsingError(
				`The year ${year} seems unusual. Please provide a date between ${new Date().getFullYear()} and ${new Date().getFullYear() + 10}.`,
				cleanDate
			);
		}

		logAI(LogLevel.DEBUG, LogCategory.DATE_PARSING, "parse_date_success", {
			result: dateObj.toISOString(),
		});

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
				throw new EventDateParsingError(
					`Invalid date: ${month}/${day}/${year} does not exist.`,
					cleanDate
				);
			}

			if (!validateEventYear(year)) {
				throw new EventDateParsingError(
					`The year ${year} seems unusual. Please provide a date between ${new Date().getFullYear()} and ${new Date().getFullYear() + 10}.`,
					cleanDate
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
			throw new EventDateParsingError(
				`The year ${year} seems unusual. Please provide a date between ${new Date().getFullYear()} and ${new Date().getFullYear() + 10}.`,
				cleanDate
			);
		}
		return parsedDate.getTime();
	}

	throw new EventDateParsingError(
		`I couldn't understand the date format. Please provide the date in a clear format like "MM/DD/YYYY" (e.g., 03/18/2025) or a natural description like "March 18, 2025", "next Tuesday", "two weeks from today", or "in 3 months".`,
		cleanDate
	);
};

// Utility to validate required fields for each step
const validateRequiredEventFields = (
	step: string,
	name: string,
	date: string,
	isRecurring?: boolean
) => {
	switch (step) {
		case "collect-date":
		case "collect-recurring":
		case "confirm":
		case "submit":
			if (!name || name.trim() === "") {
				throw new ToolValidationError(
					"Event name is required. Let's start over.",
					"name",
					"collect-name"
				);
			}
			break;
	}

	switch (step) {
		case "collect-recurring":
		case "confirm":
		case "submit":
			if (!date || date.trim() === "") {
				throw new ToolValidationError(
					"Event date is required. Let's collect the date information.",
					"date",
					"collect-date"
				);
			}
			break;
	}

	switch (step) {
		case "confirm":
		case "submit":
			if (isRecurring === undefined) {
				throw new ToolValidationError(
					"Recurring information is required. Let's collect that information.",
					"recurring",
					"collect-recurring"
				);
			}
			break;
	}
};

// Helper to parse boolean responses
const parseRecurringResponse = (
	response: boolean | string | number
): boolean => {
	if (typeof response === "boolean") {
		return response;
	}

	const responseStr = String(response).toLowerCase().trim();
	return (
		responseStr === "yes" ||
		responseStr === "y" ||
		responseStr === "true" ||
		responseStr === "1" ||
		responseStr.includes("yes") ||
		responseStr.includes("recur") ||
		responseStr.includes("annual")
	);
};

// Helper to format date display
const formatEventDate = (timestamp: number): string => {
	return new Date(timestamp).toLocaleDateString();
};

/**
 * Optimized tool for creating a new event with enhanced error handling and validation
 */
export const optimizedCreateEventTool = tool({
	description:
		"Create a new event with comprehensive validation and error handling",
	parameters: z.object({
		step: StepEnum.describe("The current step in the event creation process"),
		name: z.string().describe("The event name"),
		date: z
			.string()
			.describe("The event date in MM/DD/YYYY format or natural language"),
		isRecurring: z.boolean().describe("Whether the event recurs annually"),
		sessionId: SessionIdSchema.describe(
			"Session ID to track this specific tool flow"
		),
	}),
	execute: async ({ step, name, date, isRecurring, sessionId }) => {
		try {
			// Generate a session ID if not provided
			const flowSessionId = sessionId || `event_flow_${Date.now()}`;

			logToolCall("optimizedCreateEventTool", "execute", {
				step,
				name: name ? `[${name.length} chars]` : "empty",
				date: date ? `[${date.length} chars]` : "empty",
				isRecurring,
				flowSessionId,
			});

			// Sanitize all inputs
			const sanitizedName = sanitizeInput(name);
			const sanitizedDate = sanitizeInput(date);

			// Update the active flow state
			activeToolFlows.set(flowSessionId, {
				toolName: "createEvent",
				currentStep: step,
				data: { name: sanitizedName, date: sanitizedDate, isRecurring },
				sessionId: flowSessionId,
			});

			switch (step) {
				case "start":
					return {
						status: "in_progress",
						message: "Let's create a new event. What's the name of the event?",
						nextStep: "collect-name",
						sessionId: flowSessionId,
					};

				case "collect-name":
					try {
						EventNameSchema.parse(sanitizedName);
						return {
							status: "in_progress",
							message: `Great! When is the "${sanitizedName}" event? You can provide the date in any format (e.g., "03/18/2025", "March 18, 2025", "next Tuesday", "two weeks from today", etc.).`,
							nextStep: "collect-date",
							name: sanitizedName,
							sessionId: flowSessionId,
						};
					} catch (error) {
						if (error instanceof z.ZodError) {
							throw new ToolValidationError(
								error.errors[0]?.message || "Invalid event name",
								"name",
								step
							);
						}
						throw error;
					}

				case "collect-date":
					validateRequiredEventFields(step, sanitizedName, sanitizedDate);

					try {
						const dateTimestamp = parseEventDateWithValidation(sanitizedDate);

						return {
							status: "in_progress",
							message: `Is this a recurring annual event? (yes/no)`,
							nextStep: "collect-recurring",
							name: sanitizedName,
							date: dateTimestamp.toString(),
							sessionId: flowSessionId,
						};
					} catch (error) {
						if (error instanceof EventDateParsingError) {
							throw new ToolValidationError(error.message, "date", step);
						}
						throw error;
					}

				case "collect-recurring":
					validateRequiredEventFields(
						step,
						sanitizedName,
						sanitizedDate,
						isRecurring
					);

					try {
						const isRecurringBool = parseRecurringResponse(isRecurring);

						// Parse and validate the date
						let dateTimestamp: number;
						const timestampValue = Number(sanitizedDate);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							dateTimestamp = timestampValue;
						} else {
							dateTimestamp = parseEventDateWithValidation(sanitizedDate);
						}

						return {
							status: "in_progress",
							message: `Great! Here's a summary of the event:\n\n• **Name:** ${sanitizedName}\n• **Date:** ${formatEventDate(dateTimestamp)}\n• **Recurring annually:** ${isRecurringBool ? "Yes" : "No"}\n\nIs this information correct? (yes/no)`,
							nextStep: "confirm",
							name: sanitizedName,
							date: dateTimestamp.toString(),
							isRecurring: isRecurringBool,
							sessionId: flowSessionId,
						};
					} catch (error) {
						if (error instanceof EventDateParsingError) {
							throw new ToolValidationError(
								error.message,
								"date",
								"collect-date"
							);
						}
						throw error;
					}

				case "confirm":
					validateRequiredEventFields(
						step,
						sanitizedName,
						sanitizedDate,
						isRecurring
					);

					try {
						// Parse and validate the date one more time
						let dateTimestamp: number;
						const timestampValue = Number(sanitizedDate);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							dateTimestamp = timestampValue;
						} else {
							dateTimestamp = parseEventDateWithValidation(sanitizedDate);
						}

						return {
							status: "in_progress",
							message: `I'll now create an event "${sanitizedName}" on ${formatEventDate(dateTimestamp)} ${isRecurring ? "that recurs annually" : "as a one-time event"}.`,
							nextStep: "submit",
							name: sanitizedName,
							date: dateTimestamp.toString(),
							isRecurring,
							sessionId: flowSessionId,
						};
					} catch (error) {
						if (error instanceof EventDateParsingError) {
							throw new ToolValidationError(
								error.message,
								"date",
								"collect-date"
							);
						}
						throw error;
					}

				case "submit":
					validateRequiredEventFields(
						step,
						sanitizedName,
						sanitizedDate,
						isRecurring
					);

					try {
						const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
						if (!convexUrl) {
							throw new Error("Convex configuration error");
						}

						const convex = new ConvexHttpClient(convexUrl);

						// Parse the final date
						let dateTimestamp: number;
						const timestampValue = Number(sanitizedDate);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							dateTimestamp = timestampValue;
							logAI(
								LogLevel.DEBUG,
								LogCategory.DATE_PARSING,
								"using_timestamp_value",
								{
									timestamp: dateTimestamp,
									date: new Date(dateTimestamp).toISOString(),
								}
							);
						} else {
							dateTimestamp = parseEventDateWithValidation(sanitizedDate);
						}

						// Create the event
						logAI(LogLevel.INFO, LogCategory.EVENT, "calling_create_event", {
							name: sanitizedName,
							date: dateTimestamp,
							isRecurring,
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
								throw new ToolValidationError(
									"Authentication required. Please log in and try again.",
									"auth",
									"start"
								);
							}

							throw new Error(result.error || "Unknown error creating event");
						}

						return {
							status: "success",
							message: `✅ Successfully created event **${sanitizedName}** on ${formatEventDate(dateTimestamp)}${isRecurring ? " that will recur annually" : ""}! It's been added to your calendar.`,
							eventDetails: {
								id: result.eventId,
								name: sanitizedName,
								date: formatEventDate(dateTimestamp),
								isRecurring,
							},
							sessionId: flowSessionId,
						};
					} catch (error) {
						logError(LogCategory.TOOL_CALL, "create_event_submit_error", error);

						if (error instanceof ToolValidationError) {
							throw error;
						}

						if (error instanceof Error) {
							if (error.message.includes("authentication")) {
								throw new ToolValidationError(
									"You need to be logged in to create events.",
									"auth",
									"start"
								);
							}
							if (
								error.message.includes("date") ||
								error.message.includes("timestamp")
							) {
								throw new ToolValidationError(
									"There was an issue with the date format.",
									"date",
									"collect-date"
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
			logError(LogCategory.TOOL_CALL, "optimized_create_event_error", error);

			if (error instanceof ToolValidationError) {
				return {
					status: "error",
					message: error.message,
					nextStep: error.step,
					field: error.field,
					sessionId: sessionId,
				};
			}

			return {
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
				nextStep: "start",
				sessionId: sessionId,
			};
		}
	},
});
