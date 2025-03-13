import { z } from "zod";
import { tool } from "ai";
import {
	createRecipient,
	searchRecipients,
	getUpcomingEvents,
	createEvent,
} from "./server-actions";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

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

						// If we couldn't parse the date, throw an error
						if (!dateObj) {
							console.error(
								`DEBUGGING - Failed to parse date: ${cleanBirthday}`
							);
							throw new Error(
								`I couldn't understand the date format. Please provide the birthday in MM/DD/YYYY format (e.g., 10/02/1989).`
							);
						}

						// Get the timestamp
						birthdayTimestamp = dateObj.getTime();

						// Sanity check the year
						const year = dateObj.getFullYear();
						if (year < 1900 || year > new Date().getFullYear()) {
							console.error(`DEBUGGING - Invalid year: ${year}`);
							throw new Error(
								`The year ${year} doesn't seem right. Please provide a year between 1900 and ${new Date().getFullYear()}.`
							);
						}
					} catch (error) {
						console.error("DEBUGGING - Date validation error:", error);
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
								console.error(
									`DEBUGGING CONFIRM - Suspicious year in timestamp: ${year}`
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
						console.error("DEBUGGING CONFIRM - Error parsing birthday:", error);
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
							console.error("DEBUGGING SUBMIT - Convex URL is not configured");
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
							// It might be in MM/DD/YYYY format, try to parse it
							try {
								// Clean up the input - remove any extra spaces
								const cleanBirthday = birthday.trim();

								// Try to parse as MM/DD/YYYY
								const parts = cleanBirthday.split("/");

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

										birthdayTimestamp = dateObj.getTime();
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
							} catch (error) {
								console.error("DEBUGGING SUBMIT - Error parsing date:", error);
								throw new Error(
									"Invalid birthday format. Please provide the birthday in MM/DD/YYYY format."
								);
							}
						}

						// Sanity check - convert to date and check if it's reasonable
						const birthdayDate = new Date(birthdayTimestamp);

						const year = birthdayDate.getFullYear();
						if (year < 1900 || year > new Date().getFullYear()) {
							console.error(
								`DEBUGGING SUBMIT - Suspicious year in timestamp: ${year}`
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
							console.error(
								"DEBUGGING SUBMIT - Error from createRecipient:",
								result.error
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
						console.error("DEBUGGING SUBMIT - Error in submit step:", error);

						let errorMessage = "There was an error creating the recipient.";

						if (error instanceof Error) {
							console.error("DEBUGGING SUBMIT - Error name:", error.name);
							console.error("DEBUGGING SUBMIT - Error message:", error.message);
							console.error("DEBUGGING SUBMIT - Error stack:", error.stack);

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
					console.error("Invalid step:", step);
					return {
						status: "error",
						message:
							"I'm not sure what to do next. Let's start over. Would you like to create a new recipient?",
						nextStep: "start",
					};
			}
		} catch (error: unknown) {
			console.error("Unexpected error in createRecipientTool:", error);
			if (error instanceof Error) {
				console.error("Error name:", error.name);
				console.error("Error message:", error.message);
				console.error("Error stack:", error.stack);
			}
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
			// Initialize the Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
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
				throw new Error(result.error || "Unknown error searching recipients");
			}

			return {
				status: "success",
				message: result.message,
				recipients: result.recipients,
				count: result.count,
			};
		} catch (error: unknown) {
			console.error("Error in searchRecipientsTool:", error);

			let errorMessage = "There was an error searching for recipients.";

			if (error instanceof Error) {
				console.error("Error name:", error.name);
				console.error("Error message:", error.message);
				console.error("Error stack:", error.stack);

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
			// Initialize the Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
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
				console.log("Using structured date range:", {
					startDate,
					endDate,
					dateRangeDescription,
				});
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
				console.error("Failed to get authentication token from Clerk");
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
			console.log("Calling getUpcomingEvents with:", {
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
			console.error("Error in getUpcomingEvents tool:", error);
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
						message: `Great! When is the "${name}" event? Please provide the date in MM/DD/YYYY format.`,
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
								"I need a date for the event. Please provide a valid date in MM/DD/YYYY format.",
							nextStep: "collect-date",
							name,
						};
					}

					// Date validation and conversion to timestamp
					let dateTimestamp: number;
					try {
						// Clean up the input - remove any extra spaces
						const cleanDate = date.trim();

						// Try multiple date formats
						let dateObj: Date | null = null;

						// First try MM/DD/YYYY format
						if (!dateObj) {
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
									}
								}
							}
						}

						// If we couldn't parse the date, throw an error
						if (!dateObj) {
							console.error(`DEBUGGING - Failed to parse date: ${cleanDate}`);
							throw new Error(
								`I couldn't understand the date format. Please provide the date in MM/DD/YYYY format (e.g., 10/15/2024).`
							);
						}

						// Get the timestamp
						dateTimestamp = dateObj.getTime();

						// Sanity check the year
						const year = dateObj.getFullYear();
						const currentYear = new Date().getFullYear();
						if (year < currentYear || year > currentYear + 10) {
							console.error(`DEBUGGING - Suspicious year: ${year}`);
							throw new Error(
								`The year ${year} seems unusual. Are you sure this is the correct date? Please provide a date between ${currentYear} and ${currentYear + 10}.`
							);
						}
					} catch (error) {
						console.error("DEBUGGING - Date validation error:", error);
						return {
							status: "error",
							message:
								error instanceof Error
									? `${error.message}`
									: "That doesn't look like a valid date. Please provide the date in MM/DD/YYYY format (e.g., 10/15/2024).",
							nextStep: "collect-date",
							name,
						};
					}

					return {
						status: "in_progress",
						message: `Is this a recurring annual event? (yes/no)`,
						nextStep: "collect-recurring",
						name,
						date: dateTimestamp.toString(),
					};

				case "collect-recurring":
					if (!name || name.trim() === "" || !date || date.trim() === "") {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the name of the event?",
							nextStep: "collect-name",
						};
					}

					// Ensure date is a valid timestamp
					let eventDate: Date;
					let confirmedDateTimestamp: number;
					try {
						// Try to parse the date as a timestamp first
						const timestampValue = Number(date);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							eventDate = new Date(timestampValue);
							confirmedDateTimestamp = timestampValue;
						} else {
							throw new Error("Invalid date format.");
						}
					} catch (error) {
						console.error("DEBUGGING RECURRING - Error parsing date:", error);
						return {
							status: "error",
							message:
								"There was an issue with the date format. Let's try again with the date.",
							nextStep: "collect-date",
							name,
						};
					}

					return {
						status: "in_progress",
						message: `Great! Here's a summary of the event:\n\nName: ${name}\nDate: ${eventDate.toLocaleDateString()}\nRecurring annually: ${isRecurring ? "Yes" : "No"}\n\nIs this information correct? (yes/no)`,
						nextStep: "confirm",
						name,
						date: confirmedDateTimestamp.toString(),
						isRecurring,
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

					// Ensure date is a valid timestamp
					let confirmedEventDate: Date;
					let finalDateTimestamp: number;
					try {
						// Try to parse the date as a timestamp
						const timestampValue = Number(date);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							confirmedEventDate = new Date(timestampValue);
							finalDateTimestamp = timestampValue;
						} else {
							throw new Error("Invalid date format.");
						}
					} catch (error) {
						console.error("DEBUGGING CONFIRM - Error parsing date:", error);
						return {
							status: "error",
							message:
								"There was an issue with the date format. Let's try again with the date.",
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
							console.error("DEBUGGING SUBMIT - Convex URL is not configured");
							throw new Error("Convex URL is not configured");
						}

						const convex = new ConvexHttpClient(convexUrl);

						// Parse the date - handle timestamp format
						let dateTimestamp: number;

						// Try to parse as a timestamp
						const timestampValue = Number(date);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							// It's already a timestamp
							dateTimestamp = timestampValue;
						} else {
							throw new Error("Invalid date format.");
						}

						// Sanity check - convert to date and check if it's reasonable
						const eventDate = new Date(dateTimestamp);
						const currentYear = new Date().getFullYear();
						const year = eventDate.getFullYear();

						if (year < currentYear || year > currentYear + 10) {
							console.error(
								`DEBUGGING SUBMIT - Suspicious year in timestamp: ${year}`
							);
							throw new Error(
								`The year ${year} seems unusual. Please try again with a valid date.`
							);
						}

						// Call the createEvent function
						const result = await createEvent(convex, {
							name,
							date: dateTimestamp,
							isRecurring,
						});

						if (!result.success) {
							console.error(
								"DEBUGGING SUBMIT - Error from createEvent:",
								result.error
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
						console.error("DEBUGGING SUBMIT - Error in submit step:", error);

						let errorMessage = "There was an error creating the event.";

						if (error instanceof Error) {
							console.error("DEBUGGING SUBMIT - Error name:", error.name);
							console.error("DEBUGGING SUBMIT - Error message:", error.message);
							console.error("DEBUGGING SUBMIT - Error stack:", error.stack);

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
										"There was an issue with the date format. Let's try again with the date.",
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
					console.error("Invalid step:", step);
					return {
						status: "error",
						message:
							"I'm not sure what to do next. Let's start over. Would you like to create a new event?",
						nextStep: "start",
					};
			}
		} catch (error: unknown) {
			console.error("Unexpected error in createEventTool:", error);
			if (error instanceof Error) {
				console.error("Error name:", error.name);
				console.error("Error message:", error.message);
				console.error("Error stack:", error.stack);
			}
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
