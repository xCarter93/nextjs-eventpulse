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

/**
 * Tool for creating a new event
 * This tool guides the user through the process of creating a new event
 */
export const createEventTool = tool({
	description: "Create a new event with name, date, and recurring option",
	parameters: z.object({
		step: z
			.enum([
				"start",
				"collect-name",
				"collect-date",
				"collect-recurring",
				"confirm",
				"submit",
			])
			.describe("The current step in the event creation process"),
		name: z.string().describe("The event name (can be empty for some steps)"),
		date: z
			.string()
			.describe(
				"The event date in MM/DD/YYYY format or natural language (can be empty for some steps)"
			),
		isRecurring: z
			.boolean()
			.describe(
				"Whether the event recurs annually (can be undefined for some steps)"
			),
		sessionId: z
			.string()
			.describe("Session ID to track this specific tool flow"),
	}),
	execute: async ({
		step,
		name,
		date,
		isRecurring,
		sessionId,
	}: {
		step:
			| "start"
			| "collect-name"
			| "collect-date"
			| "collect-recurring"
			| "confirm"
			| "submit";
		name: string;
		date: string;
		isRecurring: boolean;
		sessionId: string;
	}) => {
		try {
			// Generate a session ID if not provided
			const flowSessionId = sessionId || `event_flow_${Date.now()}`;

			// Log the tool call with flow tracking information
			logToolCall("createEventTool", "execute", {
				step,
				name,
				date,
				isRecurring,
				flowSessionId,
			});

			// Update the active flow state
			activeToolFlows.set(flowSessionId, {
				toolName: "createEvent",
				currentStep: step,
				data: { name, date, isRecurring },
				sessionId: sessionId,
			});

			// Step-by-step process for creating an event
			switch (step) {
				case "start":
					return {
						status: "in_progress",
						message: "Let's create a new event. What's the name of the event?",
						nextStep: "collect-name",
						sessionId: sessionId,
					};

				case "collect-name":
					if (!name || name.trim() === "") {
						return {
							status: "error",
							message: "I need a name for the event. Please provide a name.",
							nextStep: "collect-name",
							sessionId: sessionId,
						};
					}
					return {
						status: "in_progress",
						message: `Great! When is the "${name}" event? You can provide the date in any format (e.g., "03/18/2025", "March 18, 2025", "next Tuesday", "two weeks from today", etc.).`,
						nextStep: "collect-date",
						name,
						sessionId: sessionId,
					};

				case "collect-date":
					if (!name || name.trim() === "") {
						return {
							status: "error",
							message:
								"I need the event name first. Let's start over. What's the name of the event?",
							nextStep: "collect-name",
							sessionId: sessionId,
						};
					}

					if (!date || date.trim() === "") {
						return {
							status: "error",
							message:
								'I need a date for the event. Please provide a date for the event in any format (e.g., "03/18/2025", "March 18, 2025", "next Tuesday", "two weeks from today", etc.).',
							nextStep: "collect-date",
							name,
							sessionId: sessionId,
						};
					}

					// For natural language dates, we'll try to parse it but also pass the original string
					// to the next step to ensure it's properly handled
					try {
						// Clean up the input - remove any extra spaces
						const cleanDate = date.trim();
						logAI(LogLevel.DEBUG, LogCategory.DATE_PARSING, "processing_date", {
							input: cleanDate,
						});

						// Try to parse the date to validate it, but we'll pass the original string forward
						let dateObj: Date | null = null;
						let dateTimestamp: number = 0; // Initialize with a default value

						// First try using parseDate which handles natural language
						try {
							dateTimestamp = parseDate(cleanDate);
							dateObj = new Date(dateTimestamp);
							logAI(
								LogLevel.DEBUG,
								LogCategory.DATE_PARSING,
								"parse_date_result",
								{ result: dateObj.toISOString() }
							);
						} catch (parseError) {
							logAI(
								LogLevel.ERROR,
								LogCategory.DATE_PARSING,
								"parse_date_failed",
								{ input: cleanDate, error: String(parseError) }
							);
						}

						// If parseDate failed, try other methods
						if (!dateObj || isNaN(dateObj.getTime())) {
							// Try MM/DD/YYYY format
							const parts = cleanDate.split("/");

							if (parts.length === 3) {
								const month = parseInt(parts[0], 10);
								const day = parseInt(parts[1], 10);
								const year = parseInt(parts[2], 10);

								if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
									dateObj = new Date(year, month - 1, day);

									// Verify the date is valid
									if (
										dateObj.getMonth() !== month - 1 ||
										dateObj.getDate() !== day ||
										dateObj.getFullYear() !== year
									) {
										dateObj = null;
									} else {
										dateTimestamp = dateObj.getTime();
									}
								}
							}
						}

						// Try standard date parsing as fallback
						if (!dateObj || isNaN(dateObj.getTime())) {
							const parsedDate = new Date(cleanDate);
							if (!isNaN(parsedDate.getTime())) {
								dateObj = parsedDate;
							}
						}

						// If we still couldn't parse the date, throw an error
						if (!dateObj || isNaN(dateObj.getTime())) {
							logAI(
								LogLevel.ERROR,
								LogCategory.DATE_PARSING,
								"failed_to_parse_date",
								{ input: cleanDate }
							);
							throw new Error(
								`I couldn't understand the date format. Please provide the date in a clear format like "MM/DD/YYYY" (e.g., 03/18/2025) or a natural description like "March 18, 2025", "next Tuesday", "two weeks from today", or "in 3 months".`
							);
						}

						// Sanity check the year
						const year = dateObj.getFullYear();
						const currentYear = new Date().getFullYear();
						if (year < currentYear || year > currentYear + 10) {
							logAI(
								LogLevel.ERROR,
								LogCategory.DATE_PARSING,
								"suspicious_year",
								{ year, currentYear }
							);
							throw new Error(
								`The year ${year} seems unusual. Are you sure this is the correct date? Please provide a date between ${currentYear} and ${currentYear + 10}.`
							);
						}

						// For natural language dates, pass both the timestamp and the original string
						// This ensures that the original intent is preserved
						logAI(
							LogLevel.DEBUG,
							LogCategory.DATE_PARSING,
							"proceeding_with_date",
							{ date: dateObj.toISOString() }
						);

						return {
							status: "in_progress",
							message: `Is this a recurring annual event? (yes/no)`,
							nextStep: "collect-recurring",
							name,
							date: dateTimestamp.toString(),
							sessionId: sessionId,
						};
					} catch (error) {
						logAI(
							LogLevel.ERROR,
							LogCategory.DATE_PARSING,
							"date_validation_error",
							{ error: error instanceof Error ? error.message : String(error) }
						);
						return {
							status: "error",
							message:
								error instanceof Error
									? `${error.message}`
									: "I couldn't understand that date format. Please provide the date in a clear format like MM/DD/YYYY (e.g., 03/18/2025) or a natural description like 'March 18, 2025', 'next Tuesday', or 'two weeks from today'.",
							nextStep: "collect-date",
							name,
							sessionId: sessionId,
						};
					}

				case "collect-recurring":
					if (!name || name.trim() === "" || !date || date.trim() === "") {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the name of the event?",
							nextStep: "collect-name",
							sessionId: sessionId,
						};
					}

					// Process the user's response to determine if the event is recurring
					// If isRecurring is not a boolean (e.g., if the user typed "yes" or "no"), convert it
					let isRecurringBool: boolean;
					if (typeof isRecurring === "boolean") {
						isRecurringBool = isRecurring;
					} else {
						// Convert string responses to boolean
						const response = String(isRecurring).toLowerCase().trim();
						isRecurringBool =
							response === "yes" ||
							response === "y" ||
							response === "true" ||
							response === "1" ||
							response.includes("yes") ||
							response.includes("recur") ||
							response.includes("annual");
					}

					// Ensure date is a valid timestamp or MM/DD/YYYY format
					let eventDate: Date;
					let confirmedDateTimestamp: number;
					try {
						// First try to parse the date as a timestamp
						const timestampValue = Number(date);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							// It's a valid timestamp
							eventDate = new Date(timestampValue);
							confirmedDateTimestamp = timestampValue;
						} else {
							// It might be in MM/DD/YYYY format, try to parse it
							// Clean up the input - remove any extra spaces
							const cleanDate = date.trim();

							// Try to parse as MM/DD/YYYY
							const parts = cleanDate.split("/");

							if (parts.length === 3) {
								const month = parseInt(parts[0], 10);
								const day = parseInt(parts[1], 10);
								const year = parseInt(parts[2], 10);

								if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
									eventDate = new Date(year, month - 1, day);

									// Verify the date is valid
									if (
										eventDate.getMonth() !== month - 1 ||
										eventDate.getDate() !== day ||
										eventDate.getFullYear() !== year
									) {
										throw new Error(
											`Invalid date: ${month}/${day}/${year} does not exist.`
										);
									}

									confirmedDateTimestamp = eventDate.getTime();
								} else {
									throw new Error(
										"Invalid date format. Please use MM/DD/YYYY format."
									);
								}
							} else {
								// Try using the parseDate function for natural language dates
								try {
									confirmedDateTimestamp = parseDate(cleanDate);
									eventDate = new Date(confirmedDateTimestamp);
								} catch (parseError) {
									logAI(
										LogLevel.ERROR,
										LogCategory.DATE_PARSING,
										"recurring_parse_date_error",
										{
											error:
												parseError instanceof Error
													? parseError.message
													: String(parseError),
										}
									);
									throw new Error(
										"Invalid date format. Please provide a valid date."
									);
								}
							}
						}

						// Sanity check the year
						const year = eventDate.getFullYear();
						const currentYear = new Date().getFullYear();
						if (year < currentYear || year > currentYear + 10) {
							logAI(
								LogLevel.ERROR,
								LogCategory.DATE_PARSING,
								"recurring_suspicious_year",
								{ year, currentYear }
							);
							throw new Error(
								`The year ${year} seems unusual. Are you sure this is the correct date? Please provide a date between ${currentYear} and ${currentYear + 10}.`
							);
						}
					} catch (error) {
						logAI(
							LogLevel.ERROR,
							LogCategory.DATE_PARSING,
							"recurring_parse_date_error",
							{ error: error instanceof Error ? error.message : String(error) }
						);
						return {
							status: "error",
							message:
								error instanceof Error
									? `${error.message}`
									: 'There was an issue with the date format. Please provide the date in any format (e.g., "03/18/2025", "March 18, 2025", "next Tuesday", etc.).',
							nextStep: "collect-date",
							name,
							sessionId: sessionId,
						};
					}

					return {
						status: "in_progress",
						message: `Great! Here's a summary of the event:\n\nName: ${name}\nDate: ${eventDate.toLocaleDateString()}\nRecurring annually: ${isRecurringBool ? "Yes" : "No"}\n\nIs this information correct? (yes/no)`,
						nextStep: "confirm",
						name,
						date: confirmedDateTimestamp.toString(),
						isRecurring: isRecurringBool,
						sessionId: sessionId,
					};

				case "confirm":
					if (
						!name ||
						name.trim() === "" ||
						!date ||
						date.trim() === "" ||
						isRecurring === undefined
					) {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the name of the event?",
							nextStep: "collect-name",
							sessionId: sessionId,
						};
					}

					// Ensure date is a valid timestamp or MM/DD/YYYY format
					let confirmedEventDate: Date;
					let finalDateTimestamp: number;
					try {
						// First try to parse the date as a timestamp
						const timestampValue = Number(date);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							// It's a valid timestamp
							confirmedEventDate = new Date(timestampValue);
							finalDateTimestamp = timestampValue;
						} else {
							// It might be in MM/DD/YYYY format, try to parse it
							// Clean up the input - remove any extra spaces
							const cleanDate = date.trim();

							// Try to parse as MM/DD/YYYY
							const parts = cleanDate.split("/");

							if (parts.length === 3) {
								const month = parseInt(parts[0], 10);
								const day = parseInt(parts[1], 10);
								const year = parseInt(parts[2], 10);

								if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
									confirmedEventDate = new Date(year, month - 1, day);

									// Verify the date is valid
									if (
										confirmedEventDate.getMonth() !== month - 1 ||
										confirmedEventDate.getDate() !== day ||
										confirmedEventDate.getFullYear() !== year
									) {
										throw new Error(
											`Invalid date: ${month}/${day}/${year} does not exist.`
										);
									}

									finalDateTimestamp = confirmedEventDate.getTime();
								} else {
									throw new Error(
										"Invalid date format. Please use MM/DD/YYYY format."
									);
								}
							} else {
								// Try using the parseDate function for natural language dates
								try {
									finalDateTimestamp = parseDate(cleanDate);
									confirmedEventDate = new Date(finalDateTimestamp);
								} catch (parseError) {
									logAI(
										LogLevel.ERROR,
										LogCategory.DATE_PARSING,
										"confirm_parse_date_error",
										{
											error:
												parseError instanceof Error
													? parseError.message
													: String(parseError),
										}
									);
									throw new Error(
										"Invalid date format. Please provide a valid date."
									);
								}
							}
						}

						// Sanity check the year
						const year = confirmedEventDate.getFullYear();
						const currentYear = new Date().getFullYear();
						if (year < currentYear || year > currentYear + 10) {
							logAI(
								LogLevel.ERROR,
								LogCategory.DATE_PARSING,
								"confirm_suspicious_year",
								{ year, currentYear }
							);
							throw new Error(
								`The year ${year} seems unusual. Please try again with a valid date.`
							);
						}
					} catch (error) {
						logAI(
							LogLevel.ERROR,
							LogCategory.DATE_PARSING,
							"confirm_parse_date_error",
							{ error: error instanceof Error ? error.message : String(error) }
						);
						return {
							status: "error",
							message:
								error instanceof Error
									? `${error.message}`
									: 'There was an issue with the date format. Please provide the date in any format (e.g., "03/18/2025", "March 18, 2025", "next Tuesday", etc.).',
							nextStep: "collect-date",
							name,
							sessionId: sessionId,
						};
					}

					return {
						status: "in_progress",
						message: `I'll now create an event "${name}" on ${confirmedEventDate.toLocaleDateString()} ${isRecurring ? "that recurs annually" : "as a one-time event"}.`,
						nextStep: "submit",
						name,
						date: finalDateTimestamp.toString(),
						isRecurring,
						sessionId: sessionId,
					};

				case "submit":
					if (
						!name ||
						name.trim() === "" ||
						!date ||
						date.trim() === "" ||
						isRecurring === undefined
					) {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the name of the event?",
							nextStep: "collect-name",
							sessionId: sessionId,
						};
					}

					try {
						// Initialize the Convex client
						const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
						if (!convexUrl) {
							logAI(
								LogLevel.ERROR,
								LogCategory.TOOL_CALL,
								"convex_url_not_configured",
								{}
							);
							throw new Error("Convex URL is not configured");
						}

						const convex = new ConvexHttpClient(convexUrl);

						// Parse the date - handle both timestamp and string formats
						let dateTimestamp: number;

						// First try to parse as a timestamp
						const timestampValue = Number(date);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							// It's already a timestamp
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
							// It's a string format, pass it directly to parseDate
							try {
								// Use the parseDate function to handle various date formats
								logAI(
									LogLevel.DEBUG,
									LogCategory.DATE_PARSING,
									"parsing_date_string",
									{ input: date }
								);

								// For natural language dates, pass the string directly
								dateTimestamp = parseDate(date);

								// Verify the date is correct (for debugging)
								const parsedDate = new Date(dateTimestamp);
								const today = new Date();
								today.setHours(0, 0, 0, 0);

								if (date.toLowerCase() === "two weeks from today") {
									// Calculate expected date (2 weeks from today)
									const expectedDate = new Date(today);
									expectedDate.setDate(today.getDate() + 14);

									logAI(
										LogLevel.DEBUG,
										LogCategory.DATE_PARSING,
										"date_parsing_debug",
										{
											today: today.toISOString(),
											expectedDate: expectedDate.toISOString(),
											actualParsedDate: parsedDate.toISOString(),
										}
									);

									// Check if the dates are approximately equal (within 1 day)
									const diffTime = Math.abs(
										parsedDate.getTime() - expectedDate.getTime()
									);
									const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

									if (diffDays > 1) {
										logAI(
											LogLevel.ERROR,
											LogCategory.DATE_PARSING,
											"date_parsing_mismatch",
											{
												expected: expectedDate.toISOString(),
												actual: parsedDate.toISOString(),
											}
										);
									} else {
										logAI(
											LogLevel.DEBUG,
											LogCategory.DATE_PARSING,
											"date_parsing_success",
											{ diffDays }
										);
									}
								}

								logAI(
									LogLevel.DEBUG,
									LogCategory.DATE_PARSING,
									"date_parsing_success",
									{
										timestamp: dateTimestamp,
										date: parsedDate.toISOString(),
									}
								);
							} catch (parseError) {
								logAI(
									LogLevel.ERROR,
									LogCategory.DATE_PARSING,
									"parse_date_error",
									{
										error:
											parseError instanceof Error
												? parseError.message
												: String(parseError),
									}
								);
								throw new Error(
									"Invalid date format. Please provide a valid date."
								);
							}
						}

						// Sanity check - convert to date and check if it's reasonable
						const eventDate = new Date(dateTimestamp);
						const currentYear = new Date().getFullYear();
						const year = eventDate.getFullYear();

						if (year < currentYear || year > currentYear + 10) {
							logAI(
								LogLevel.ERROR,
								LogCategory.DATE_PARSING,
								"suspicious_year_in_timestamp",
								{ year, currentYear }
							);
							throw new Error(
								`The year ${year} seems unusual. Please try again with a valid date.`
							);
						}

						// Call the createEvent function
						logAI(LogLevel.INFO, LogCategory.EVENT, "calling_create_event", {
							name,
							date: dateTimestamp,
							isRecurring,
						});
						const result = await createEvent(convex, {
							name,
							date: dateTimestamp,
							isRecurring,
						});

						if (!result.success) {
							logAI(LogLevel.ERROR, LogCategory.EVENT, "create_event_error", {
								error: result.error,
							});

							// Check for authentication-related errors
							if (
								result.error &&
								(result.error.includes("authentication") ||
									result.error.includes("logged in") ||
									result.error.includes("auth") ||
									result.error.includes("Not authenticated"))
							) {
								return {
									status: "error",
									message:
										"You need to be logged in to create an event. Please log in and try again.",
									nextStep: "start",
									sessionId: sessionId,
								};
							}

							throw new Error(result.error || "Unknown error creating event");
						}

						return {
							status: "success",
							message: `Successfully created a new event "${name}" on ${eventDate.toLocaleDateString()}${isRecurring ? " that will recur annually" : ""}! It's been added to your calendar.`,
							eventDetails: {
								id: result.eventId,
								name,
								date: eventDate.toLocaleDateString(),
								isRecurring,
							},
							sessionId: sessionId,
						};
					} catch (error: unknown) {
						logError(LogCategory.TOOL_CALL, "create_event_submit_error", error);

						let errorMessage = "There was an error creating the event.";

						if (error instanceof Error) {
							logAI(
								LogLevel.ERROR,
								LogCategory.TOOL_CALL,
								"create_event_submit_error_details",
								{
									error: error instanceof Error ? error.message : String(error),
								}
							);

							errorMessage = error.message;

							// Check for authentication-related errors
							if (
								error.message.includes("authentication") ||
								error.message.includes("logged in") ||
								error.message.includes("auth") ||
								error.message.includes("Not authenticated")
							) {
								errorMessage =
									"You need to be logged in to create an event. Please log in and try again.";
							}

							// Check for date-related errors
							if (
								error.message.includes("date") ||
								error.message.includes("timestamp")
							) {
								return {
									status: "error",
									message:
										"There was an issue with the date format. Please provide the date in a clear format like MM/DD/YYYY (e.g., 03/18/2025) or a natural description like 'March 18, 2025' or 'next Tuesday'.",
									nextStep: "collect-date",
									name,
									sessionId: sessionId,
								};
							}
						}

						return {
							status: "error",
							message: errorMessage,
							nextStep: "start",
							sessionId: sessionId,
						};
					}

				default:
					logAI(LogLevel.ERROR, LogCategory.TOOL_CALL, "invalid_step", {
						step,
					});
					return {
						status: "error",
						message:
							"I'm not sure what to do next. Let's start over. Would you like to create a new event?",
						nextStep: "start",
						sessionId: sessionId,
					};
			}
		} catch (error: unknown) {
			logError(LogCategory.TOOL_CALL, "create_event_tool_error", error);
			return {
				status: "error",
				message:
					"An unexpected error occurred. Let's try again. Would you like to create a new event?",
				nextStep: "start",
				sessionId: sessionId,
			};
		}
	},
});
