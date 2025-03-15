import { z } from "zod";
import { tool } from "ai";
import { createRecipient, parseDate } from "../server-actions";
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
		sessionId: z
			.string()
			.describe("Session ID to track this specific tool flow"),
	}),
	execute: async ({
		step,
		name,
		email,
		birthday,
		sessionId,
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
		sessionId: string;
	}) => {
		try {
			// Generate a session ID if not provided
			const flowSessionId = sessionId || `recipient_flow_${Date.now()}`;

			// Log the tool call with flow tracking information
			logToolCall("createRecipientTool", "execute", {
				step,
				name,
				email,
				birthday,
				flowSessionId,
			});

			// Update the active flow state
			activeToolFlows.set(flowSessionId, {
				toolName: "createRecipient",
				currentStep: step,
				data: { name, email, birthday },
				sessionId: sessionId,
			});

			// Step-by-step process for creating a recipient
			switch (step) {
				case "start":
					return {
						status: "in_progress",
						message: "Let's create a new recipient. What's their name?",
						nextStep: "collect-name",
						sessionId: sessionId,
					};

				case "collect-name":
					if (!name || name.trim() === "") {
						return {
							status: "error",
							message:
								"I need a name for the recipient. Please provide a name.",
							nextStep: "collect-name",
							sessionId: sessionId,
						};
					}
					return {
						status: "in_progress",
						message: `Great! Now, what's ${name}'s email address?`,
						nextStep: "collect-email",
						name,
						sessionId: sessionId,
					};

				case "collect-email":
					if (!name || name.trim() === "") {
						return {
							status: "error",
							message:
								"I need the recipient's name first. Let's start over. What's their name?",
							nextStep: "collect-name",
							sessionId: sessionId,
						};
					}

					if (!email || email.trim() === "") {
						return {
							status: "error",
							message:
								"I need an email address for the recipient. Please provide a valid email.",
							nextStep: "collect-email",
							name,
							sessionId: sessionId,
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
							sessionId: sessionId,
						};
					}

					return {
						status: "in_progress",
						message: `Now, when is ${name}'s birthday? Please provide it in MM/DD/YYYY format.`,
						nextStep: "collect-birthday",
						name,
						email,
						sessionId: sessionId,
					};

				case "collect-birthday":
					if (!name || name.trim() === "" || !email || email.trim() === "") {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
							sessionId: sessionId,
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
							sessionId: sessionId,
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
							sessionId: sessionId,
						};
					}

					return {
						status: "in_progress",
						message: `Great! Here's a summary of the recipient:\n\nName: ${name}\nEmail: ${email}\nBirthday: ${new Date(birthdayTimestamp).toLocaleDateString()}\n\nIs this information correct? (yes/no)`,
						nextStep: "confirm",
						name,
						email,
						birthday: birthdayTimestamp.toString(),
						sessionId: sessionId,
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
							sessionId: sessionId,
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
							sessionId: sessionId,
						};
					}

					return {
						status: "in_progress",
						message: `I'll now create a recipient for ${name} with email ${email} and birthday ${birthdayDate.toLocaleDateString()}.`,
						nextStep: "submit",
						name,
						email,
						birthday: confirmedBirthdayTimestamp.toString(),
						sessionId: sessionId,
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
									sessionId: sessionId,
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
							sessionId: sessionId,
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
							"I'm not sure what to do next. Let's start over. Would you like to create a new recipient?",
						nextStep: "start",
						sessionId: sessionId,
					};
			}
		} catch (error: unknown) {
			logError(LogCategory.TOOL_CALL, "create_recipient_tool_error", error);
			return {
				status: "error",
				message:
					"An unexpected error occurred. Let's try again. Would you like to create a new recipient?",
				nextStep: "start",
				sessionId: sessionId,
			};
		}
	},
});
