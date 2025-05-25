import { z } from "zod";
import { tool } from "ai";
import { getUpcomingEvents } from "../server-actions";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";
import {
	logAI,
	logError,
	logToolCall,
	LogLevel,
	LogCategory,
} from "../logging";

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
		// Add a new parameter for search term - make it required but allow empty string
		searchTerm: z
			.string()
			.describe(
				"Search term to filter events by name or description (can be empty string)"
			),
		sessionId: z
			.string()
			.describe("Session ID to track this specific tool flow"),
	}),
	execute: async ({
		dateRange,
		includeTypes,
		searchTerm,
		sessionId,
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
		searchTerm: string;
		sessionId: string;
	}) => {
		try {
			// Start a timer to track execution time
			const startTime = Date.now();

			// Log the tool call
			logToolCall("getUpcomingEventsTool", "execute", {
				dateRange:
					typeof dateRange === "string" ? dateRange : dateRange.description,
				includeTypes,
				searchTerm,
				sessionId,
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

				// If we have a specific search term or relativeDescription is "upcoming", expand the date range
				if (
					dateRange.relativeDescription === "upcoming" ||
					(searchTerm && searchTerm.trim() !== "")
				) {
					// Keep startDate as today, but set endDate to 1 year from now for better event discovery
					const oneYearFromNow = new Date(startDate);
					oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
					endDate = oneYearFromNow.toISOString().split("T")[0];

					logAI(
						LogLevel.INFO,
						LogCategory.DATE_PARSING,
						"expanded_date_range_for_search",
						{
							startDate,
							endDate,
							originalEndDate: dateRange.endDate,
							searchTerm: searchTerm || "none",
						}
					);
				}

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
				// For backward compatibility, use a simple approach
				// Just pass the string to the server and let it handle the parsing
				const dateRangeStr =
					typeof dateRange === "string" ? dateRange : "unknown date range";
				dateRangeDescription = dateRangeStr;

				// Set startDate to today by default
				startDate = new Date().toISOString().split("T")[0];

				// Default to 30 days from now for endDate
				const defaultEndDate = new Date();
				defaultEndDate.setDate(defaultEndDate.getDate() + 30);
				endDate = defaultEndDate.toISOString().split("T")[0];

				logAI(
					LogLevel.INFO,
					LogCategory.DATE_PARSING,
					"using_default_date_range",
					{
						originalInput: dateRangeStr,
						startDate,
						endDate,
					}
				);
			}

			// Log time taken for date parsing
			const dateParsingTime = Date.now() - startTime;
			logAI(LogLevel.INFO, LogCategory.PERFORMANCE, "date_parsing_time", {
				timeMs: dateParsingTime,
			});

			// Get the authentication token from Clerk
			const authStartTime = Date.now();
			const session = await auth();
			const token = await session.getToken({ template: "convex" });

			if (!token) {
				logAI(LogLevel.ERROR, LogCategory.AUTH, "failed_to_get_auth_token", {});
				return {
					success: false,
					error: "Authentication failed. Please make sure you're logged in.",
					sessionId,
				};
			}

			// Set the authentication token on the Convex client
			convex.setAuth(token);

			// Log time taken for authentication
			const authTime = Date.now() - authStartTime;
			logAI(LogLevel.INFO, LogCategory.PERFORMANCE, "auth_time", {
				timeMs: authTime,
			});

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

			// Set a timeout for the Convex query
			const queryStartTime = Date.now();
			let queryTimedOut = false;

			// Create a promise that resolves with the query result
			const queryPromise = getUpcomingEvents(convex, {
				startDate,
				endDate,
				includeBirthdays,
				includeEvents,
			});

			// Create a promise that rejects after 20 seconds
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => {
					queryTimedOut = true;
					reject(new Error("Query timed out after 20 seconds"));
				}, 20000);
			});

			// Race the query against the timeout
			const result = (await Promise.race([
				queryPromise,
				timeoutPromise,
			])) as Awaited<ReturnType<typeof getUpcomingEvents>>;

			// Log query time
			const queryTime = Date.now() - queryStartTime;
			logAI(LogLevel.INFO, LogCategory.PERFORMANCE, "query_time", {
				timeMs: queryTime,
				timedOut: queryTimedOut,
			});

			if (!result.success) {
				logAI(LogLevel.ERROR, LogCategory.EVENT, "get_upcoming_events_error", {
					error: result.error,
				});
				return {
					success: false,
					error: result.error || "Failed to retrieve upcoming events",
					sessionId,
				};
			}

			// Format the results for display
			const events = result.events || [];

			// Log the number of events retrieved
			logAI(LogLevel.INFO, LogCategory.EVENT, "events_retrieved", {
				count: events.length,
				eventNames: events.map((event) => event.name),
			});

			// Always apply client-side filtering if searchTerm is provided and not empty
			const filterStartTime = Date.now();
			let filteredEvents = events;
			if (searchTerm && searchTerm.trim() !== "") {
				// Split the search term into individual words for more flexible matching
				const searchTermWords = searchTerm
					.toLowerCase()
					.split(/\s+/)
					.filter((word) => word.length > 0);

				filteredEvents = events.filter((event) => {
					// Check if any of the search words appear in the event name or person
					const eventNameLower = event.name.toLowerCase();
					const personNameLower = event.person
						? event.person.toLowerCase()
						: "";

					// Return true if any search word is found in either the event name or person name
					return searchTermWords.some(
						(word) =>
							eventNameLower.includes(word) || personNameLower.includes(word)
					);
				});

				logAI(LogLevel.INFO, LogCategory.EVENT, "client_side_filtering", {
					originalCount: events.length,
					filteredCount: filteredEvents.length,
					searchTerm,
					searchWords: searchTermWords,
					filterTimeMs: Date.now() - filterStartTime,
				});
			}

			const formattedEvents = filteredEvents.map((event) => {
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
				}${searchTerm ? ` matching "${searchTerm}"` : ""}.`;
			} else {
				response = `Here are the upcoming events ${
					dateRangeDescription ? `for ${dateRangeDescription}` : ""
				}${searchTerm ? ` matching "${searchTerm}"` : ""}:\n\n`;

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

			// Add more detailed logging for debugging
			const totalTime = Date.now() - startTime;
			logAI(LogLevel.INFO, LogCategory.EVENT, "get_upcoming_events_result", {
				eventCount: formattedEvents.length,
				dateRange: {
					startDate,
					endDate,
					description: dateRangeDescription,
				},
				searchTerm,
				totalTimeMs: totalTime,
			});

			return {
				success: true,
				events: formattedEvents,
				response,
				sessionId,
			};
		} catch (error) {
			// Improve error logging
			logError(LogCategory.TOOL_CALL, "get_upcoming_events_tool_error", error);
			console.error("Error in getUpcomingEventsTool:", error);

			// Provide a more helpful error message
			let errorMessage = "An unknown error occurred while retrieving events";
			if (error instanceof Error) {
				errorMessage = error.message;

				// Check for timeout errors
				if (errorMessage.includes("timed out")) {
					errorMessage =
						"The request took too long to complete. Please try a more specific search or a narrower date range.";
				}
				// Check for network errors
				else if (
					errorMessage.includes("network") ||
					errorMessage.includes("fetch")
				) {
					errorMessage =
						"There was a network error while retrieving events. Please check your internet connection and try again.";
				}
			}

			return {
				success: false,
				error: errorMessage,
				sessionId,
			};
		}
	},
});
