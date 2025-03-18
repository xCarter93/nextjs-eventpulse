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
				"The recipient's birthday in MM/DD/YYYY format or natural language (can be empty for some steps)"
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
						message: `Now, when is ${name}'s birthday? You can provide it in any format (e.g., "04/20/1969", "April 20, 1969", etc.).`,
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
								'I need a birthday for the recipient. You can provide it in any format (e.g., "04/20/1969", "April 20, 1969", etc.).',
							nextStep: "collect-birthday",
							name,
							email,
							sessionId: sessionId,
						};
					}

					// Birthday validation and conversion to timestamp
					let birthdayTimestamp: number = 0; // Initialize with a default value
					try {
						// Clean up the input - remove any extra spaces
						const cleanBirthday = birthday.trim();
						logAI(
							LogLevel.DEBUG,
							LogCategory.DATE_PARSING,
							"processing_birthday",
							{
								input: cleanBirthday,
							}
						);

						// Try to parse the date to validate it
						let dateObj: Date | null = null;

						// First try using parseDate which handles natural language
						try {
							birthdayTimestamp = parseDate(cleanBirthday);
							dateObj = new Date(birthdayTimestamp);
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
								{ input: cleanBirthday, error: String(parseError) }
							);
						}

						// If parseDate failed, try other methods
						if (!dateObj || isNaN(dateObj.getTime())) {
							// Try MM/DD/YYYY format
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
									} else {
										birthdayTimestamp = dateObj.getTime();
									}
								}
							}
						}

						// Try standard date parsing as fallback
						if (!dateObj || isNaN(dateObj.getTime())) {
							const parsedDate = new Date(cleanBirthday);
							if (!isNaN(parsedDate.getTime())) {
								dateObj = parsedDate;
								birthdayTimestamp = dateObj.getTime();
							}
						}

						// If we still couldn't parse the date, throw an error
						if (!dateObj || isNaN(dateObj.getTime())) {
							logAI(
								LogLevel.ERROR,
								LogCategory.DATE_PARSING,
								"failed_to_parse_date",
								{ input: cleanBirthday }
							);
							throw new Error(
								`I couldn't understand the date format. Please provide the date in a clear format like "MM/DD/YYYY" (e.g., 04/20/1969) or a natural description like "April 20, 1969".`
							);
						}

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
									: "I couldn't understand that date format. Please provide the birthday in a clear format like MM/DD/YYYY (e.g., 04/20/1969) or a natural description like 'April 20, 1969'.",
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

					// Try to parse the birthday using same approach as collect-birthday
					let confirmedBirthdayTimestamp: number;
					try {
						// If it's already a timestamp, use it
						const timestampValue = Number(birthday);
						if (!isNaN(timestampValue) && timestampValue > 0) {
							confirmedBirthdayTimestamp = timestampValue;
						} else {
							// Otherwise try to parse it
							try {
								confirmedBirthdayTimestamp = parseDate(birthday.trim());
							} catch (parseError) {
								logAI(
									LogLevel.ERROR,
									LogCategory.DATE_PARSING,
									"confirm_parse_birthday_error",
									{
										error:
											parseError instanceof Error
												? parseError.message
												: String(parseError),
									}
								);
								throw new Error(
									`Failed to parse birthday: ${parseError instanceof Error ? parseError.message : String(parseError)}`
								);
							}
						}

						// Sanity check the date
						const birthdayDate = new Date(confirmedBirthdayTimestamp);
						const year = birthdayDate.getFullYear();
						if (year < 1900 || year > new Date().getFullYear()) {
							throw new Error(
								`The year ${year} doesn't seem right. Please provide a year between 1900 and ${new Date().getFullYear()}.`
							);
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
								"There was an issue with the birthday format. Let's try again with the birthday.",
							nextStep: "collect-birthday",
							name,
							email,
							sessionId: sessionId,
						};
					}

					return {
						status: "in_progress",
						message: `I'll now create a recipient for ${name} with email ${email} and birthday ${new Date(confirmedBirthdayTimestamp).toLocaleDateString()}.`,
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

						// Parse the birthday - handle both timestamp and natural language format
						let birthdayTimestamp: number;

						// First try to parse as a timestamp
						const timestampValue = Number(birthday);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							// It's already a timestamp
							birthdayTimestamp = timestampValue;
							logAI(
								LogLevel.DEBUG,
								LogCategory.DATE_PARSING,
								"using_timestamp_value",
								{
									timestamp: birthdayTimestamp,
									date: new Date(birthdayTimestamp).toISOString(),
								}
							);
						} else {
							// It's a string format, try to parse it
							try {
								logAI(
									LogLevel.DEBUG,
									LogCategory.DATE_PARSING,
									"parsing_date_string",
									{ input: birthday }
								);

								// For natural language dates, use parseDate
								birthdayTimestamp = parseDate(birthday);

								logAI(
									LogLevel.DEBUG,
									LogCategory.DATE_PARSING,
									"date_parsing_success",
									{
										timestamp: birthdayTimestamp,
										date: new Date(birthdayTimestamp).toISOString(),
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
									"I couldn't understand that date format. Please provide the birthday in a clear format like MM/DD/YYYY (e.g., 04/20/1969) or a natural description like 'April 20, 1969'."
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
