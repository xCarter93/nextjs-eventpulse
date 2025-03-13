import { api } from "../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

/**
 * Function to create a new recipient (server-side)
 * This is a wrapper around the Convex mutation for use in AI tools
 * @param client - The Convex client
 * @param name - The recipient's name
 * @param email - The recipient's email
 * @param birthday - The recipient's birthday as a timestamp
 * @returns The result of the mutation
 */
export async function createRecipient(
	client: ConvexHttpClient,
	{
		name,
		email,
		birthday,
	}: {
		name: string;
		email: string;
		birthday: number;
	}
) {
	try {
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

		console.log("Got authentication token from Clerk");

		// Set the authentication token on the Convex client
		client.setAuth(token);

		console.log("Calling Convex mutation with data:", {
			name,
			email,
			birthday,
		});
		const result = await client.mutation(api.recipients.addRecipient, {
			name,
			email,
			birthday,
		});

		console.log("Mutation result:", result);
		return {
			success: true,
			recipientId: result,
		};
	} catch (error) {
		console.error("Error creating recipient:", error);
		let errorMessage = "Unknown error";

		if (error instanceof Error) {
			errorMessage = error.message;
			console.error("Error name:", error.name);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);

			// Check for authentication errors
			if (
				error.message.includes("Not authenticated") ||
				error.message.includes("authentication") ||
				error.message.includes("auth")
			) {
				errorMessage =
					"Authentication failed. Please make sure you're logged in and have the necessary permissions.";
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
}

/**
 * Function to search for recipients by name, email, or birthday
 * This is a wrapper around the Convex query for use in AI tools
 * @param client - The Convex client
 * @param searchParams - The search parameters (name, email, or birthday)
 * @returns The matching recipients
 */
export async function searchRecipients(
	client: ConvexHttpClient,
	searchParams: {
		name?: string;
		email?: string;
		birthday?: string | number;
	}
) {
	try {
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
		client.setAuth(token);

		// Get all recipients for the user
		const recipients = await client.query(api.recipients.getRecipients);

		if (!recipients || recipients.length === 0) {
			return {
				success: true,
				recipients: [],
				message: "You don't have any contacts yet.",
			};
		}

		// Filter recipients based on search parameters
		let filteredRecipients = [...recipients];

		// Filter by name if provided
		if (searchParams.name) {
			const nameQuery = searchParams.name.toLowerCase();
			filteredRecipients = filteredRecipients.filter((recipient) =>
				recipient.name.toLowerCase().includes(nameQuery)
			);
		}

		// Filter by email if provided
		if (searchParams.email) {
			const emailQuery = searchParams.email.toLowerCase();
			filteredRecipients = filteredRecipients.filter((recipient) =>
				recipient.email.toLowerCase().includes(emailQuery)
			);
		}

		// Filter by birthday if provided
		if (searchParams.birthday) {
			// Handle different birthday formats
			let targetDate: Date | null = null;

			if (typeof searchParams.birthday === "number") {
				// If it's already a timestamp
				targetDate = new Date(searchParams.birthday);
			} else if (typeof searchParams.birthday === "string") {
				// Try to parse as MM/DD or MM/DD/YYYY
				const parts = searchParams.birthday.split("/");

				if (parts.length >= 2) {
					const month = parseInt(parts[0], 10) - 1; // 0-based months
					const day = parseInt(parts[1], 10);

					// If year is provided, use it, otherwise use current year
					const year =
						parts.length > 2
							? parseInt(parts[2], 10)
							: new Date().getFullYear();

					if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
						targetDate = new Date(year, month, day);
					}
				}
			}

			if (targetDate) {
				// For birthday matching, we only care about month and day, not year
				const targetMonth = targetDate.getMonth();
				const targetDay = targetDate.getDate();

				filteredRecipients = filteredRecipients.filter((recipient) => {
					const recipientBirthday = new Date(recipient.birthday);
					return (
						recipientBirthday.getMonth() === targetMonth &&
						recipientBirthday.getDate() === targetDay
					);
				});
			}
		}

		// Format the results for display
		const formattedRecipients = filteredRecipients.map((recipient) => ({
			id: recipient._id,
			name: recipient.name,
			email: recipient.email,
			birthday: new Date(recipient.birthday).toLocaleDateString(),
		}));

		return {
			success: true,
			recipients: formattedRecipients,
			count: formattedRecipients.length,
			message:
				formattedRecipients.length > 0
					? `Found ${formattedRecipients.length} matching contact${formattedRecipients.length === 1 ? "" : "s"}.`
					: "No contacts found matching your search criteria.",
		};
	} catch (error) {
		console.error("Error searching recipients:", error);
		let errorMessage = "Unknown error";

		if (error instanceof Error) {
			errorMessage = error.message;
			console.error("Error name:", error.name);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);

			// Check for authentication errors
			if (
				error.message.includes("Not authenticated") ||
				error.message.includes("authentication") ||
				error.message.includes("auth")
			) {
				errorMessage =
					"Authentication failed. Please make sure you're logged in and have the necessary permissions.";
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
}

/**
 * Function to get upcoming events based on date range
 * This is a wrapper around the Convex query for use in AI tools
 * @param client - The Convex client
 * @param dateParams - The date parameters for filtering events
 * @returns The upcoming events
 */
export async function getUpcomingEvents(
	client: ConvexHttpClient,
	dateParams: {
		startDate?: Date | number | string;
		endDate?: Date | number | string;
		includeEvents?: boolean;
		includeBirthdays?: boolean;
		includeHolidays?: boolean;
	}
) {
	try {
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
		client.setAuth(token);

		// Parse date parameters
		let startTimestamp: number;
		let endTimestamp: number;

		// Default to current date if no start date is provided
		if (!dateParams.startDate) {
			const now = new Date();
			now.setHours(0, 0, 0, 0);
			startTimestamp = now.getTime();
		} else {
			startTimestamp = parseDate(dateParams.startDate);
		}

		// Default to 30 days from start date if no end date is provided
		if (!dateParams.endDate) {
			const end = new Date(startTimestamp);
			end.setDate(end.getDate() + 30); // Default to 30 days from start
			end.setHours(23, 59, 59, 999);
			endTimestamp = end.getTime();
		} else {
			endTimestamp = parseDate(dateParams.endDate);
			// Ensure end date includes the full day
			const endDate = new Date(endTimestamp);
			endDate.setHours(23, 59, 59, 999);
			endTimestamp = endDate.getTime();
		}

		// Set default inclusion parameters if not specified
		const includeEvents = dateParams.includeEvents !== false;
		const includeBirthdays = dateParams.includeBirthdays !== false;
		// const includeHolidays = dateParams.includeHolidays !== false;

		// Get all events for the user
		const events = await client.query(api.events.getEvents);
		const recipients = await client.query(api.recipients.getRecipients);

		// Process and filter events
		const upcomingEvents = [];

		// Add custom events if included
		if (includeEvents && events && events.length > 0) {
			for (const event of events) {
				const eventDate = new Date(event.date);
				if (
					eventDate.getTime() >= startTimestamp &&
					eventDate.getTime() <= endTimestamp
				) {
					upcomingEvents.push({
						type: "event",
						name: event.name,
						date: eventDate.toLocaleDateString(),
						timestamp: eventDate.getTime(),
					});
				}
			}
		}

		// Add birthdays if included
		if (includeBirthdays && recipients && recipients.length > 0) {
			for (const recipient of recipients) {
				const birthdayDate = new Date(recipient.birthday);
				const currentYear = new Date().getFullYear();

				// Check this year's birthday
				const thisYearBirthday = new Date(
					currentYear,
					birthdayDate.getMonth(),
					birthdayDate.getDate()
				);
				if (
					thisYearBirthday.getTime() >= startTimestamp &&
					thisYearBirthday.getTime() <= endTimestamp
				) {
					upcomingEvents.push({
						type: "birthday",
						name: `${recipient.name}'s Birthday`,
						date: thisYearBirthday.toLocaleDateString(),
						timestamp: thisYearBirthday.getTime(),
						person: recipient.name,
					});
				}

				// Check next year's birthday if the date range extends to next year
				const nextYearStart = new Date(currentYear + 1, 0, 1);
				if (endTimestamp >= nextYearStart.getTime()) {
					const nextYearBirthday = new Date(
						currentYear + 1,
						birthdayDate.getMonth(),
						birthdayDate.getDate()
					);
					if (nextYearBirthday.getTime() <= endTimestamp) {
						upcomingEvents.push({
							type: "birthday",
							name: `${recipient.name}'s Birthday`,
							date: nextYearBirthday.toLocaleDateString(),
							timestamp: nextYearBirthday.getTime(),
							person: recipient.name,
						});
					}
				}
			}
		}

		// Sort events by date
		upcomingEvents.sort((a, b) => a.timestamp - b.timestamp);

		return {
			success: true,
			events: upcomingEvents,
			count: upcomingEvents.length,
			dateRange: {
				start: new Date(startTimestamp).toLocaleDateString(),
				end: new Date(endTimestamp).toLocaleDateString(),
			},
			message:
				upcomingEvents.length > 0
					? `Found ${upcomingEvents.length} upcoming event${upcomingEvents.length === 1 ? "" : "s"}.`
					: "No upcoming events found in the specified date range.",
		};
	} catch (error) {
		console.error("Error getting upcoming events:", error);
		let errorMessage = "Unknown error";

		if (error instanceof Error) {
			errorMessage = error.message;
			console.error("Error name:", error.name);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);

			// Check for authentication errors
			if (
				error.message.includes("Not authenticated") ||
				error.message.includes("authentication") ||
				error.message.includes("auth")
			) {
				errorMessage =
					"Authentication failed. Please make sure you're logged in and have the necessary permissions.";
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
}

/**
 * Helper function to parse different date formats into a timestamp
 * @param date - The date to parse (Date object, timestamp, or string)
 * @returns The timestamp in milliseconds
 */
export function parseDate(date: Date | number | string): number {
	if (date instanceof Date) {
		return date.getTime();
	}

	if (typeof date === "number") {
		return date;
	}

	if (typeof date === "string") {
		console.log(`Parsing date string: "${date}"`);
		// Try to parse relative dates
		const lowerDate = date.toLowerCase();
		const now = new Date();
		now.setHours(0, 0, 0, 0);

		// Handle "today", "tomorrow", "yesterday"
		if (lowerDate === "today") {
			console.log(`Parsed "today" as ${now.toISOString()}`);
			return now.getTime();
		}
		if (lowerDate === "tomorrow") {
			const tomorrow = new Date(now);
			tomorrow.setDate(tomorrow.getDate() + 1);
			console.log(`Parsed "tomorrow" as ${tomorrow.toISOString()}`);
			return tomorrow.getTime();
		}
		if (lowerDate === "yesterday") {
			const yesterday = new Date(now);
			yesterday.setDate(yesterday.getDate() - 1);
			console.log(`Parsed "yesterday" as ${yesterday.toISOString()}`);
			return yesterday.getTime();
		}

		// Handle "next week", "next month", "next year"
		if (lowerDate === "next week") {
			const nextWeek = new Date(now);
			nextWeek.setDate(nextWeek.getDate() + 7);
			console.log(`Parsed "next week" as ${nextWeek.toISOString()}`);
			return nextWeek.getTime();
		}
		if (lowerDate === "next month") {
			const nextMonth = new Date(now);
			nextMonth.setMonth(nextMonth.getMonth() + 1);
			console.log(`Parsed "next month" as ${nextMonth.toISOString()}`);
			return nextMonth.getTime();
		}
		if (lowerDate === "next year") {
			const nextYear = new Date(now);
			nextYear.setFullYear(nextYear.getFullYear() + 1);
			console.log(`Parsed "next year" as ${nextYear.toISOString()}`);
			return nextYear.getTime();
		}

		// Handle "X weeks/days/months from today/now"
		const fromTodayMatch = lowerDate.match(
			/^(\d+) (day|days|week|weeks|month|months|year|years) from (today|now)$/
		);
		if (fromTodayMatch) {
			console.log(
				`Matched "X from today/now" pattern: ${JSON.stringify(fromTodayMatch)}`
			);
			const amount = parseInt(fromTodayMatch[1], 10);
			const unit = fromTodayMatch[2];
			const future = new Date(now);

			if (unit === "day" || unit === "days") {
				future.setDate(future.getDate() + amount);
			} else if (unit === "week" || unit === "weeks") {
				future.setDate(future.getDate() + amount * 7);
			} else if (unit === "month" || unit === "months") {
				future.setMonth(future.getMonth() + amount);
			} else if (unit === "year" || unit === "years") {
				future.setFullYear(future.getFullYear() + amount);
			}

			console.log(`Parsed "${lowerDate}" as ${future.toISOString()}`);
			return future.getTime();
		}

		// Handle "in X days/weeks/months/years"
		const inMatch = lowerDate.match(
			/^in (\d+) (day|days|week|weeks|month|months|year|years)$/
		);
		if (inMatch) {
			console.log(`Matched "in X" pattern: ${JSON.stringify(inMatch)}`);
			const amount = parseInt(inMatch[1], 10);
			const unit = inMatch[2];
			const future = new Date(now);

			if (unit === "day" || unit === "days") {
				future.setDate(future.getDate() + amount);
			} else if (unit === "week" || unit === "weeks") {
				future.setDate(future.getDate() + amount * 7);
			} else if (unit === "month" || unit === "months") {
				future.setMonth(future.getMonth() + amount);
			} else if (unit === "year" || unit === "years") {
				future.setFullYear(future.getFullYear() + amount);
			}

			console.log(`Parsed "${lowerDate}" as ${future.toISOString()}`);
			return future.getTime();
		}

		// Try to parse as MM/DD/YYYY
		const dateParts = date.split("/");
		if (dateParts.length >= 2) {
			const month = parseInt(dateParts[0], 10) - 1; // 0-based months
			const day = parseInt(dateParts[1], 10);
			const year =
				dateParts.length > 2
					? parseInt(dateParts[2], 10)
					: new Date().getFullYear();

			if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
				const parsedDate = new Date(year, month, day);
				console.log(`Parsed MM/DD/YYYY format as ${parsedDate.toISOString()}`);
				return parsedDate.getTime();
			}
		}

		// Try standard date parsing as fallback
		const parsedDate = new Date(date);
		if (!isNaN(parsedDate.getTime())) {
			console.log(
				`Parsed with standard Date constructor as ${parsedDate.toISOString()}`
			);
			return parsedDate.getTime();
		}

		// Additional handling for "two weeks from today" and similar formats
		// This is a more flexible approach that doesn't rely on exact pattern matching
		if (
			lowerDate.includes("week") ||
			lowerDate.includes("day") ||
			lowerDate.includes("month") ||
			lowerDate.includes("year")
		) {
			console.log(`Trying flexible parsing for: "${lowerDate}"`);

			// Extract number if present
			let amount = 1; // Default to 1 if no number is specified
			const numberMatch = lowerDate.match(/(\d+)/);
			if (numberMatch) {
				amount = parseInt(numberMatch[1], 10);
				console.log(`Extracted amount: ${amount}`);
			} else {
				// Handle text numbers like "two", "three", etc.
				const textNumbers: Record<string, number> = {
					one: 1,
					two: 2,
					three: 3,
					four: 4,
					five: 5,
					six: 6,
					seven: 7,
					eight: 8,
					nine: 9,
					ten: 10,
					a: 1,
					an: 1,
				};

				for (const [word, value] of Object.entries(textNumbers)) {
					if (lowerDate.includes(word)) {
						amount = value;
						console.log(`Extracted text number: ${word} = ${amount}`);
						break;
					}
				}
			}

			// Determine time unit and calculate future date
			const future = new Date(now);

			if (lowerDate.includes("week")) {
				console.log(`Adding ${amount} weeks (${amount * 7} days)`);
				future.setDate(future.getDate() + amount * 7);
			} else if (lowerDate.includes("month")) {
				console.log(`Adding ${amount} months`);
				future.setMonth(future.getMonth() + amount);
			} else if (lowerDate.includes("year")) {
				console.log(`Adding ${amount} years`);
				future.setFullYear(future.getFullYear() + amount);
			} else if (lowerDate.includes("day")) {
				console.log(`Adding ${amount} days`);
				future.setDate(future.getDate() + amount);
			}

			console.log(`Current date: ${now.toISOString()}`);
			console.log(`Calculated future date: ${future.toISOString()}`);
			return future.getTime();
		}
	}

	// Default to current date if parsing fails
	console.error(`Failed to parse date: ${date}, using current date instead`);
	return new Date().getTime();
}

/**
 * Function to create a new event (server-side)
 * This is a wrapper around the Convex mutation for use in AI tools
 * @param client - The Convex client
 * @param name - The event name
 * @param date - The event date as a timestamp
 * @param isRecurring - Whether the event is recurring annually
 * @returns The result of the mutation
 */
export async function createEvent(
	client: ConvexHttpClient,
	{
		name,
		date,
		isRecurring,
	}: {
		name: string;
		date: number;
		isRecurring: boolean;
	}
) {
	try {
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

		console.log("Got authentication token from Clerk");

		// Set the authentication token on the Convex client
		client.setAuth(token);

		console.log("Calling Convex mutation with data:", {
			name,
			date,
			isRecurring,
		});
		const result = await client.mutation(api.events.createEvent, {
			name,
			date,
			isRecurring,
		});

		console.log("Mutation result:", result);
		return {
			success: true,
			eventId: result,
		};
	} catch (error) {
		console.error("Error creating event:", error);
		let errorMessage = "Unknown error";

		if (error instanceof Error) {
			errorMessage = error.message;
			console.error("Error name:", error.name);
			console.error("Error message:", error.message);
			console.error("Error stack:", error.stack);

			// Check for authentication errors
			if (
				error.message.includes("Not authenticated") ||
				error.message.includes("authentication") ||
				error.message.includes("auth")
			) {
				errorMessage =
					"Authentication failed. Please make sure you're logged in and have the necessary permissions.";
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
}
