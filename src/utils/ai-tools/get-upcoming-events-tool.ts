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
		sessionId: z
			.string()
			.describe("Session ID to track this specific tool flow"),
	}),
	execute: async ({
		dateRange,
		includeTypes,
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
		sessionId: string;
	}) => {
		try {
			// Log the tool call
			logToolCall("getUpcomingEventsTool", "execute", {
				dateRange:
					typeof dateRange === "string" ? dateRange : dateRange.description,
				includeTypes,
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
					sessionId,
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
					sessionId,
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
				sessionId,
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "get_upcoming_events_tool_error", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "An unknown error occurred while retrieving events",
				sessionId,
			};
		}
	},
});
