import { z } from "zod";
import { tool } from "ai";
import {
	createRecipient,
	searchRecipients,
	getUpcomingEvents,
	createEvent,
	parseDate,
} from "./server-actions";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";
import { logAI, logError, logToolCall, LogLevel, LogCategory } from "./logging";

/**
 * Tool for creating a new recipient
 * This tool guides the user through the process of creating a new recipient
 */
export const createRecipientTool = tool({
	description: "Create a new recipient with name, email, and birthday",
	parameters: z.object({
		step: z
			.enum([
				"start",
				"collect-name",
				"collect-email",
				"collect-birthday",
				"confirm",
				"submit",
			])
			.describe("The current step in the recipient creation process"),
		name: z
			.string()
			.describe("The recipient's name (can be empty for some steps)"),
		email: z
			.string()
			.describe(
				"The recipient's email address - must be a valid email format (can be empty for some steps)"
			),
		birthday: z
			.string()
			.describe(
				"The recipient's birthday in MM/DD/YYYY format (can be empty for some steps)"
			),
	}),
	execute: async ({
		step,
		name,
		email,
		birthday,
	}: {
		step:
			| "start"
			| "collect-name"
			| "collect-email"
			| "collect-birthday"
			| "confirm"
			| "submit";
		name: string;
		email: string;
		birthday: string;
	}) => {
		try {
			// Step-by-step process for creating a recipient
			switch (step) {
				case "start":
					return {
						status: "in_progress",
						message: "Let's create a new recipient. What's their name?",
						nextStep: "collect-name",
					};

				case "collect-name":
					if (!name || name.trim() === "") {
						return {
							status: "error",
							message:
								"I need a name for the recipient. Please provide a name.",
							nextStep: "collect-name",
						};
					}
					return {
						status: "in_progress",
						message: `Great! Now, what's ${name}'s email address?`,
						nextStep: "collect-email",
						name,
					};

				case "collect-email":
					if (!name || name.trim() === "") {
						return {
							status: "error",
							message:
								"I need the recipient's name first. Let's start over. What's their name?",
							nextStep: "collect-name",
						};
					}

					if (!email || email.trim() === "") {
						return {
							status: "error",
							message:
								"I need an email address for the recipient. Please provide a valid email.",
							nextStep: "collect-email",
							name,
						};
					}

					// Basic email validation
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(email)) {
						return {
							status: "error",
							message:
								"That doesn't look like a valid email address. Please provide a valid email.",
							nextStep: "collect-email",
							name,
						};
					}

					return {
						status: "in_progress",
						message: `Now, when is ${name}'s birthday? Please provide it in MM/DD/YYYY format.`,
						nextStep: "collect-birthday",
						name,
						email,
					};

				case "collect-birthday":
					if (!name || name.trim() === "" || !email || email.trim() === "") {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					if (!birthday || birthday.trim() === "") {
						return {
							status: "error",
							message:
								"I need a birthday for the recipient. Please provide it in MM/DD/YYYY format.",
							nextStep: "collect-birthday",
							name,
							email,
						};
					}

					// Basic date validation and conversion to timestamp
					let birthdayTimestamp: number;
					try {
						// Clean up the input - remove any extra spaces
						const cleanBirthday = birthday.trim();

						// Try multiple date formats
						let dateObj: Date | null = null;

						// First try MM/DD/YYYY format
						if (!dateObj) {
							const parts = cleanBirthday.split("/");

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
									}
								}
							}
						}

						// Try standard date parsing as fallback for natural language dates
						if (!dateObj) {
							const parsedDate = new Date(cleanBirthday);
							if (!isNaN(parsedDate.getTime())) {
								dateObj = parsedDate;
							}
						}

						// If we still couldn't parse the date, try to interpret it as a relative date
						if (!dateObj) {
							// Initialize the Convex URL to check configuration
							const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
							if (!convexUrl) {
								throw new Error("Convex URL is not configured");
							}

							// Use the parseDate function to handle relative dates
							try {
								const timestamp = parseDate(cleanBirthday);
								dateObj = new Date(timestamp);
							} catch (parseError) {
								logAI(
									LogLevel.DEBUG,
									LogCategory.DATE_PARSING,
									"parse_date_failed",
									{ input: cleanBirthday, error: String(parseError) }
								);
								throw new Error(
									`I couldn't understand the date format. Please provide the date in a clear format like "MM/DD/YYYY" (e.g., 03/18/2025) or a natural description like "March 18, 2025", "next Tuesday", "two weeks from today", or "in 3 months".`
								);
							}
						}

						// If we still couldn't parse the date, throw an error
						if (!dateObj) {
							logAI(
								LogLevel.ERROR,
								LogCategory.DATE_PARSING,
								"failed_to_parse_date",
								{ input: cleanBirthday }
							);
							throw new Error(
								`I couldn't understand the date format. Please provide the date in a clear format like "MM/DD/YYYY" (e.g., 03/18/2025) or a natural description like "March 18, 2025", "next Tuesday", "two weeks from today", or "in 3 months".`
							);
						}

						// Get the timestamp
						birthdayTimestamp = dateObj.getTime();

						// Sanity check the year
						const year = dateObj.getFullYear();
						if (year < 1900 || year > new Date().getFullYear()) {
							logAI(LogLevel.ERROR, LogCategory.DATE_PARSING, "invalid_year", {
								year,
							});
							throw new Error(
								`The year ${year} doesn't seem right. Please provide a year between 1900 and ${new Date().getFullYear()}.`
							);
						}
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
									: "That doesn't look like a valid date. Please provide the birthday in MM/DD/YYYY format (e.g., 10/02/1989).",
							nextStep: "collect-birthday",
							name,
							email,
						};
					}

					return {
						status: "in_progress",
						message: `Great! Here's a summary of the recipient:\n\nName: ${name}\nEmail: ${email}\nBirthday: ${new Date(birthdayTimestamp).toLocaleDateString()}\n\nIs this information correct? (yes/no)`,
						nextStep: "confirm",
						name,
						email,
						birthday: birthdayTimestamp.toString(),
					};

				case "confirm":
					if (
						!name ||
						name.trim() === "" ||
						!email ||
						email.trim() === "" ||
						!birthday ||
						birthday.trim() === ""
					) {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					// Ensure birthday is a valid timestamp
					let birthdayDate: Date;
					let confirmedBirthdayTimestamp: number;
					try {
						// Try to parse the birthday as a timestamp first
						const timestampValue = Number(birthday);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							birthdayDate = new Date(timestampValue);
							confirmedBirthdayTimestamp = timestampValue;

							// Sanity check - if the date is before 1900 or after current year, it's probably wrong
							const year = birthdayDate.getFullYear();
							if (year < 1900 || year > new Date().getFullYear()) {
								logAI(
									LogLevel.ERROR,
									LogCategory.DATE_PARSING,
									"suspicious_year_in_timestamp",
									{ year, timestamp: confirmedBirthdayTimestamp }
								);
								throw new Error(
									`The year ${year} doesn't seem right. Please provide a year between 1900 and ${new Date().getFullYear()}.`
								);
							}
						} else {
							// If it's not a valid timestamp, try to parse as MM/DD/YYYY
							// Clean up the input - remove any extra spaces
							const cleanBirthday = birthday.trim();

							// Try to parse as MM/DD/YYYY
							const parts = cleanBirthday.split("/");

							if (parts.length === 3) {
								const month = parseInt(parts[0], 10);
								const day = parseInt(parts[1], 10);
								const year = parseInt(parts[2], 10);

								if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
									birthdayDate = new Date(year, month - 1, day);

									// Verify the date is valid
									if (
										birthdayDate.getMonth() !== month - 1 ||
										birthdayDate.getDate() !== day ||
										birthdayDate.getFullYear() !== year
									) {
										throw new Error(
											`Invalid date: ${month}/${day}/${year} does not exist.`
										);
									}

									confirmedBirthdayTimestamp = birthdayDate.getTime();
								} else {
									throw new Error(
										"Invalid date format. Please use MM/DD/YYYY format."
									);
								}
							} else {
								throw new Error(
									"Invalid date format. Please use MM/DD/YYYY format."
								);
							}
						}
					} catch (error) {
						logAI(
							LogLevel.ERROR,
							LogCategory.DATE_PARSING,
							"confirm_parse_birthday_error",
							{ error: error instanceof Error ? error.message : String(error) }
						);
						return {
							status: "error",
							message:
								error instanceof Error
									? `${error.message} Let's try again with the birthday.`
									: "There was an issue with the birthday format. Let's try again with the birthday.",
							nextStep: "collect-birthday",
							name,
							email,
						};
					}

					return {
						status: "in_progress",
						message: `I'll now create a recipient for ${name} with email ${email} and birthday ${birthdayDate.toLocaleDateString()}.`,
						nextStep: "submit",
						name,
						email,
						birthday: confirmedBirthdayTimestamp.toString(),
					};

				case "submit":
					if (
						!name ||
						name.trim() === "" ||
						!email ||
						email.trim() === "" ||
						!birthday ||
						birthday.trim() === ""
					) {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
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

						// Parse the birthday - handle both timestamp and MM/DD/YYYY format
						let birthdayTimestamp: number;

						// First try to parse as a timestamp
						const timestampValue = Number(birthday);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							// It's already a timestamp
							birthdayTimestamp = timestampValue;
						} else {
							// It's a string format, pass it directly to parseDate
							try {
								// Use the parseDate function to handle various date formats
								logAI(
									LogLevel.DEBUG,
									LogCategory.DATE_PARSING,
									"parsing_date_string",
									{ input: birthday }
								);

								// For natural language dates, pass the string directly
								birthdayTimestamp = parseDate(birthday);

								// Verify the date is correct (for debugging)
								const parsedDate = new Date(birthdayTimestamp);
								const today = new Date();
								today.setHours(0, 0, 0, 0);

								if (birthday.toLowerCase() === "two weeks from today") {
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
										timestamp: birthdayTimestamp,
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
									"Invalid birthday format. Please provide the birthday in MM/DD/YYYY format."
								);
							}
						}

						// Sanity check - convert to date and check if it's reasonable
						const birthdayDate = new Date(birthdayTimestamp);

						const year = birthdayDate.getFullYear();
						if (year < 1900 || year > new Date().getFullYear()) {
							logAI(
								LogLevel.ERROR,
								LogCategory.DATE_PARSING,
								"suspicious_year",
								{ year }
							);
							throw new Error(
								`The year ${year} doesn't seem right. Please try again with a valid date.`
							);
						}

						// Call the createRecipient function
						const result = await createRecipient(convex, {
							name,
							email,
							birthday: birthdayTimestamp,
						});

						if (!result.success) {
							logAI(
								LogLevel.ERROR,
								LogCategory.TOOL_CALL,
								"create_recipient_error",
								{ error: result.error }
							);

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
										"You need to be logged in to create a recipient. Please log in and try again.",
									nextStep: "start",
								};
							}

							throw new Error(
								result.error || "Unknown error creating recipient"
							);
						}

						return {
							status: "success",
							message: `Successfully created a new recipient for ${name}! They've been added to your recipients list.`,
							recipientDetails: {
								id: result.recipientId,
								name,
								email,
								birthday: birthdayDate.toLocaleDateString(),
							},
						};
					} catch (error: unknown) {
						logError(
							LogCategory.TOOL_CALL,
							"create_recipient_submit_error",
							error
						);

						let errorMessage = "There was an error creating the recipient.";

						if (error instanceof Error) {
							logAI(
								LogLevel.ERROR,
								LogCategory.TOOL_CALL,
								"create_recipient_submit_error_details",
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
									"You need to be logged in to create a recipient. Please log in and try again.";
							}

							// Check for birthday-related errors
							if (
								error.message.includes("birthday") ||
								error.message.includes("timestamp") ||
								error.message.includes("date")
							) {
								return {
									status: "error",
									message:
										"There was an issue with the birthday format. Let's try again with the birthday.",
									nextStep: "collect-birthday",
									name,
									email,
								};
							}
						}

						return {
							status: "error",
							message: errorMessage,
							nextStep: "start",
						};
					}

				default:
					logAI(LogLevel.ERROR, LogCategory.TOOL_CALL, "invalid_step", {
						step,
					});
					return {
						status: "error",
						message:
							"I'm not sure what to do next. Let's start over. Would you like to create a new recipient?",
						nextStep: "start",
					};
			}
		} catch (error: unknown) {
			logError(LogCategory.TOOL_CALL, "create_recipient_tool_error", error);
			return {
				status: "error",
				message:
					"An unexpected error occurred. Let's try again. Would you like to create a new recipient?",
				nextStep: "start",
			};
		}
	},
});

/**
 * Tool for searching recipients by name, email, or birthday
 * This tool allows users to find contacts based on different search criteria
 */
export const searchRecipientsTool = tool({
	description: "Search for recipients/contacts by name, email, or birthday",
	parameters: z.object({
		searchQuery: z
			.string()
			.describe(
				"The search query to find recipients. Can be a name, email, or birthday (MM/DD or MM/DD/YYYY format). " +
					"Examples: 'John Smith', 'gmail.com', '10/15'"
			),
		searchType: z
			.enum(["name", "email", "birthday", "any"])
			.describe(
				"The type of search to perform. Use 'any' if uncertain which field to search."
			),
	}),
	execute: async ({
		searchQuery,
		searchType,
	}: {
		searchQuery: string;
		searchType: "name" | "email" | "birthday" | "any";
	}) => {
		try {
			// Log the tool call
			logToolCall("searchRecipientsTool", "execute", {
				searchQuery,
				searchType,
			});

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

			// Map the search type to the appropriate parameters
			const searchParams: {
				name?: string;
				email?: string;
				birthday?: string;
			} = {};

			if (searchType === "name" || searchType === "any") {
				searchParams.name = searchQuery;
			}

			if (searchType === "email" || searchType === "any") {
				searchParams.email = searchQuery;
			}

			if (searchType === "birthday" || searchType === "any") {
				searchParams.birthday = searchQuery;
			}

			// Call the searchRecipients function
			const result = await searchRecipients(convex, searchParams);

			if (!result.success) {
				logAI(
					LogLevel.ERROR,
					LogCategory.TOOL_CALL,
					"search_recipients_error",
					{ error: result.error }
				);
				throw new Error(result.error || "Unknown error searching recipients");
			}

			return {
				status: "success",
				message: result.message,
				recipients: result.recipients,
				count: result.count,
			};
		} catch (error: unknown) {
			logError(LogCategory.TOOL_CALL, "search_recipients_tool_error", error);

			let errorMessage = "There was an error searching for recipients.";

			if (error instanceof Error) {
				errorMessage = error.message;

				// Check for authentication-related errors
				if (
					error.message.includes("authentication") ||
					error.message.includes("logged in") ||
					error.message.includes("auth") ||
					error.message.includes("Not authenticated")
				) {
					errorMessage =
						"You need to be logged in to search recipients. Please log in and try again.";
				}
			}

			return {
				status: "error",
				message: errorMessage,
			};
		}
	},
});

/**
 * Tool for retrieving upcoming events based on date ranges
 * This tool allows users to find events within specific time periods
 */
export const getUpcomingEventsTool = tool({
	description: "Get upcoming events within a specified date range",
	parameters: z.object({
		dateRange: z
			.union([
				// Support both the old string format for backward compatibility
				z
					.string()
					.describe(
						"The date range for the event search (e.g., 'next week', 'next month', 'from June 1 to July 15')"
					),
				// And the new structured format
				z
					.object({
						description: z
							.string()
							.describe(
								"The original date range description from the user's message"
							),
						startDate: z
							.string()
							.describe("The start date in ISO format (YYYY-MM-DD)"),
						endDate: z
							.string()
							.describe("The end date in ISO format (YYYY-MM-DD)"),
						relativeDescription: z
							.string()
							.describe("A human-readable description of the date range"),
					})
					.describe("A structured representation of the date range"),
			])
			.describe("The date range for the event search"),
		includeTypes: z
			.enum(["all", "birthdays", "events"])
			.describe(
				"The types of events to include in the results ('all' for both birthdays and events, 'birthdays' for only birthdays, 'events' for only custom events)"
			),
	}),
	execute: async ({
		dateRange,
		includeTypes,
	}: {
		dateRange:
			| string
			| {
					description: string;
					startDate: string;
					endDate: string;
					relativeDescription: string;
			  };
		includeTypes: "all" | "birthdays" | "events";
	}) => {
		try {
			// Log the tool call
			logToolCall("getUpcomingEventsTool", "execute", {
				dateRange:
					typeof dateRange === "string" ? dateRange : dateRange.description,
				includeTypes,
			});

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

			// Parse the date range
			let startDate: string | undefined;
			let endDate: string | undefined;
			let dateRangeDescription: string;

			// Check if dateRange is already in structured format
			if (
				typeof dateRange === "object" &&
				dateRange.startDate &&
				dateRange.endDate
			) {
				startDate = dateRange.startDate;
				endDate = dateRange.endDate;
				dateRangeDescription =
					dateRange.relativeDescription || dateRange.description;
				logAI(
					LogLevel.INFO,
					LogCategory.DATE_PARSING,
					"using_structured_date_range",
					{
						startDate,
						endDate,
						dateRangeDescription,
					}
				);
			} else {
				// Handle the string format (for backward compatibility)
				const dateRangeStr =
					typeof dateRange === "string" ? dateRange : "unknown date range";
				dateRangeDescription = dateRangeStr;

				// Handle different date range formats
				if (dateRangeStr.toLowerCase().includes("next")) {
					// For "next week", "next month", etc.
					startDate = "today";
					endDate = dateRangeStr;
				} else if (
					dateRangeStr.toLowerCase().includes("from") &&
					dateRangeStr.toLowerCase().includes("to")
				) {
					// For "from X to Y" format
					const parts = dateRangeStr
						.split(/from|to/i)
						.filter((part) => part.trim().length > 0);
					if (parts.length >= 2) {
						startDate = parts[0].trim();
						endDate = parts[1].trim();
					}
				} else {
					// Default to treating the input as the start date with a default end date
					startDate = dateRangeStr;
					// End date will be handled by the server function default (30 days)
				}
			}

			// Get the authentication token from Clerk
			const session = await auth();
			const token = await session.getToken({ template: "convex" });

			if (!token) {
				logAI(LogLevel.ERROR, LogCategory.AUTH, "failed_to_get_auth_token", {});
				return {
					success: false,
					error: "Authentication failed. Please make sure you're logged in.",
				};
			}

			// Set the authentication token on the Convex client
			convex.setAuth(token);

			// Convert includeTypes to the format expected by the server action
			const includeBirthdays =
				includeTypes === "all" || includeTypes === "birthdays";
			const includeEvents = includeTypes === "all" || includeTypes === "events";

			// Call the Convex function to get upcoming events
			logAI(LogLevel.INFO, LogCategory.EVENT, "calling_get_upcoming_events", {
				startDate,
				endDate,
				includeBirthdays,
				includeEvents,
			});

			const result = await getUpcomingEvents(convex, {
				startDate,
				endDate,
				includeBirthdays,
				includeEvents,
			});

			if (!result.success) {
				logAI(LogLevel.ERROR, LogCategory.EVENT, "get_upcoming_events_error", {
					error: result.error,
				});
				return {
					success: false,
					error: result.error || "Failed to retrieve upcoming events",
				};
			}

			// Format the results for display
			const events = result.events || [];
			const formattedEvents = events.map((event) => {
				const date = new Date(event.timestamp);
				return {
					...event,
					formattedDate: date.toLocaleDateString("en-US", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					}),
				};
			});

			// Sort events by date
			formattedEvents.sort((a, b) => a.timestamp - b.timestamp);

			// Create a human-readable response
			let response = "";

			if (formattedEvents.length === 0) {
				response = `No events found ${
					dateRangeDescription ? `for ${dateRangeDescription}` : ""
				}.`;
			} else {
				response = `Here are the upcoming events ${
					dateRangeDescription ? `for ${dateRangeDescription}` : ""
				}:\n\n`;

				formattedEvents.forEach((event) => {
					response += `📅 ${event.formattedDate}: ${event.name}`;
					if (event.type === "birthday") {
						response += ` (Birthday)`;
					}
					if (event.person) {
						response += `\n   Person: ${event.person}`;
					}
					response += "\n\n";
				});
			}

			return {
				success: true,
				events: formattedEvents,
				response,
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "get_upcoming_events_tool_error", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "An unknown error occurred while retrieving events",
			};
		}
	},
});

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
				"The event date in MM/DD/YYYY format (can be empty for some steps)"
			),
		isRecurring: z
			.boolean()
			.describe(
				"Whether the event recurs annually (can be undefined for some steps)"
			),
	}),
	execute: async ({
		step,
		name,
		date,
		isRecurring,
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
	}) => {
		try {
			// Log the tool call
			logToolCall("createEventTool", "execute", {
				step,
				name,
				date,
				isRecurring,
			});

			// Step-by-step process for creating an event
			switch (step) {
				case "start":
					return {
						status: "in_progress",
						message: "Let's create a new event. What's the name of the event?",
						nextStep: "collect-name",
					};

				case "collect-name":
					if (!name || name.trim() === "") {
						return {
							status: "error",
							message: "I need a name for the event. Please provide a name.",
							nextStep: "collect-name",
						};
					}
					return {
						status: "in_progress",
						message: `Great! When is the "${name}" event? You can provide the date in any format (e.g., "03/18/2025", "March 18, 2025", "next Tuesday", "two weeks from today", etc.).`,
						nextStep: "collect-date",
						name,
					};

				case "collect-date":
					if (!name || name.trim() === "") {
						return {
							status: "error",
							message:
								"I need the event name first. Let's start over. What's the name of the event?",
							nextStep: "collect-name",
						};
					}

					if (!date || date.trim() === "") {
						return {
							status: "error",
							message:
								'I need a date for the event. Please provide a date for the event in any format (e.g., "03/18/2025", "March 18, 2025", "next Tuesday", "two weeks from today", etc.).',
							nextStep: "collect-date",
							name,
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
						};
					}

				case "collect-recurring":
					if (!name || name.trim() === "" || !date || date.trim() === "") {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the name of the event?",
							nextStep: "collect-name",
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
						};
					}

					return {
						status: "in_progress",
						message: `Great! Here's a summary of the event:\n\nName: ${name}\nDate: ${eventDate.toLocaleDateString()}\nRecurring annually: ${isRecurringBool ? "Yes" : "No"}\n\nIs this information correct? (yes/no)`,
						nextStep: "confirm",
						name,
						date: confirmedDateTimestamp.toString(),
						isRecurring: isRecurringBool,
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
						};
					}

					return {
						status: "in_progress",
						message: `I'll now create an event "${name}" on ${confirmedEventDate.toLocaleDateString()} ${isRecurring ? "that recurs annually" : "as a one-time event"}.`,
						nextStep: "submit",
						name,
						date: finalDateTimestamp.toString(),
						isRecurring,
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
								};
							}
						}

						return {
							status: "error",
							message: errorMessage,
							nextStep: "start",
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
					};
			}
		} catch (error: unknown) {
			logError(LogCategory.TOOL_CALL, "create_event_tool_error", error);
			return {
				status: "error",
				message:
					"An unexpected error occurred. Let's try again. Would you like to create a new event?",
				nextStep: "start",
			};
		}
	},
});
/**
 * Function to create a new recipient using the Convex mutation
 * This is commented out for now as we're not actually calling the mutation in the tool
 */
/*
async function addRecipient({ name, email, birthday }: { name: string; email: string; birthday: number }) {
  // In a real implementation, you would call the Convex mutation here
  // For example:
  // const result = await convex.mutation(api.recipients.addRecipient, {
  //   name,
  //   email,
  //   birthday,
  // });
  // return result;
  
  // For now, we'll just return a mock result
  return { id: 'mock-id-' + Date.now() };
}
*/
