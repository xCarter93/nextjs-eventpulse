import { tool } from "ai";
import { z } from "zod";
import {
	createEvent,
	createRecipient,
	getUpcomingEvents,
	searchRecipients,
} from "../server-actions";
import { getAuthenticatedConvexClient } from "./auth";
import { handleToolError } from "./error-handling";
import { parseDate } from "../server-actions";
import { logToolCall, LogLevel, LogCategory, logAI } from "../logging";

export const tools = {
	createEvent: tool({
		description:
			"Create a new event with name, date, and optional recurring setting",
		parameters: z.object({
			name: z.string().describe("The event name"),
			date: z
				.string()
				.describe(
					'The event date in any format (MM/DD/YYYY, "March 15, 2024", "next Tuesday", etc.)'
				),
			isRecurring: z
				.boolean()
				.optional()
				.describe("Whether the event recurs annually (defaults to false)"),
		}),
		execute: async ({ name, date, isRecurring = false }) => {
			try {
				logToolCall("createEvent", "execute", { name, date, isRecurring });

				const convex = await getAuthenticatedConvexClient();
				const dateTimestamp = parseDate(date);

				// Validate the date
				const eventDate = new Date(dateTimestamp);
				const year = eventDate.getFullYear();
				if (year < 1900 || year > new Date().getFullYear() + 10) {
					throw new Error(
						`The year ${year} seems unusual. Please provide a year between 1900 and ${new Date().getFullYear() + 10}.`
					);
				}

				const result = await createEvent(convex, {
					name,
					date: dateTimestamp,
					isRecurring,
				});

				if (!result.success) {
					throw new Error(result.error || "Failed to create event");
				}

				logAI(LogLevel.INFO, LogCategory.EVENT, "event_created_successfully", {
					eventId: result.eventId,
					name,
					date: eventDate.toISOString(),
				});

				return {
					success: true,
					message: `Successfully created event "${name}" on ${eventDate.toLocaleDateString()}${isRecurring ? " (recurring annually)" : ""}`,
					eventId: result.eventId,
					name,
					date: eventDate.toLocaleDateString(),
					isRecurring,
				};
			} catch (error) {
				logAI(LogLevel.ERROR, LogCategory.TOOL_CALL, "create_event_error", {
					error: error instanceof Error ? error.message : String(error),
				});
				return handleToolError(error);
			}
		},
	}),

	createRecipient: tool({
		description:
			"Create a new contact/recipient with name, email, and birthday",
		parameters: z.object({
			name: z.string().describe("The recipient's full name"),
			email: z.string().email().describe("The recipient's email address"),
			birthday: z
				.string()
				.describe(
					'The recipient\'s birthday in any format (MM/DD/YYYY, "April 20, 1969", etc.)'
				),
		}),
		execute: async ({ name, email, birthday }) => {
			try {
				logToolCall("createRecipient", "execute", { name, email, birthday });

				const convex = await getAuthenticatedConvexClient();
				const birthdayTimestamp = parseDate(birthday);

				// Validate the birthday
				const birthdayDate = new Date(birthdayTimestamp);
				const year = birthdayDate.getFullYear();
				if (year < 1900 || year > new Date().getFullYear()) {
					throw new Error(
						`The year ${year} doesn't seem right. Please provide a year between 1900 and ${new Date().getFullYear()}.`
					);
				}

				const result = await createRecipient(convex, {
					name,
					email,
					birthday: birthdayTimestamp,
				});

				if (!result.success) {
					throw new Error(result.error || "Failed to create recipient");
				}

				logAI(
					LogLevel.INFO,
					LogCategory.TOOL_CALL,
					"recipient_created_successfully",
					{
						recipientId: result.recipientId,
						name,
						email,
					}
				);

				return {
					success: true,
					message: `Successfully added ${name} to your contacts!`,
					recipientId: result.recipientId,
					name,
					email,
					birthday: birthdayDate.toLocaleDateString(),
				};
			} catch (error) {
				logAI(LogLevel.ERROR, LogCategory.TOOL_CALL, "create_recipient_error", {
					error: error instanceof Error ? error.message : String(error),
				});
				return handleToolError(error);
			}
		},
	}),

	searchEvents: tool({
		description: "Search for upcoming events within a date range",
		parameters: z.object({
			query: z
				.string()
				.optional()
				.describe("Search term to filter events by name"),
			dateRange: z
				.string()
				.optional()
				.describe(
					'Date range description (e.g., "next week", "this month", "next 30 days")'
				),
			includeTypes: z
				.enum(["all", "birthdays", "events"])
				.default("all")
				.describe("Types of events to include"),
			startDate: z
				.string()
				.optional()
				.describe("Start date in YYYY-MM-DD format"),
			endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
		}),
		execute: async ({ query, dateRange, includeTypes, startDate, endDate }) => {
			try {
				logToolCall("searchEvents", "execute", {
					query,
					dateRange,
					includeTypes,
					startDate,
					endDate,
				});

				const convex = await getAuthenticatedConvexClient();

				// Set default date range if not provided
				const defaultStartDate =
					startDate || new Date().toISOString().split("T")[0];
				let defaultEndDate = endDate;

				if (!defaultEndDate) {
					const thirtyDaysFromNow = new Date();
					thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
					defaultEndDate = thirtyDaysFromNow.toISOString().split("T")[0];
				}

				const includeBirthdays =
					includeTypes === "all" || includeTypes === "birthdays";
				const includeEvents =
					includeTypes === "all" || includeTypes === "events";

				const result = await getUpcomingEvents(convex, {
					startDate: defaultStartDate,
					endDate: defaultEndDate,
					includeBirthdays,
					includeEvents,
				});

				if (!result.success) {
					throw new Error(result.error || "Failed to retrieve events");
				}

				let events = result.events || [];

				// Apply client-side filtering if query is provided
				if (query && query.trim() !== "") {
					const searchTerms = query
						.toLowerCase()
						.split(/\s+/)
						.filter((term) => term.length > 0);
					events = events.filter((event) => {
						const eventName = event.name.toLowerCase();
						const personName = event.person ? event.person.toLowerCase() : "";

						return searchTerms.some(
							(term) => eventName.includes(term) || personName.includes(term)
						);
					});
				}

				// Format events for display
				const formattedEvents = events.map((event) => ({
					...event,
					formattedDate: new Date(event.timestamp).toLocaleDateString("en-US", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					}),
				}));

				// Sort by date
				formattedEvents.sort((a, b) => a.timestamp - b.timestamp);

				logAI(LogLevel.INFO, LogCategory.EVENT, "events_search_completed", {
					totalFound: formattedEvents.length,
					query,
					dateRange,
				});

				return {
					success: true,
					events: formattedEvents,
					message:
						formattedEvents.length === 0
							? `No events found${dateRange ? ` for ${dateRange}` : ""}${query ? ` matching "${query}"` : ""}.`
							: `Found ${formattedEvents.length} event${formattedEvents.length !== 1 ? "s" : ""}${dateRange ? ` for ${dateRange}` : ""}${query ? ` matching "${query}"` : ""}.`,
					searchTerm: query,
					dateRange,
				};
			} catch (error) {
				logAI(LogLevel.ERROR, LogCategory.TOOL_CALL, "search_events_error", {
					error: error instanceof Error ? error.message : String(error),
				});
				return handleToolError(error);
			}
		},
	}),

	searchRecipients: tool({
		description: "Search for contacts/recipients by name, email, or birthday",
		parameters: z.object({
			query: z
				.string()
				.describe("Search query (name, email, or birthday in MM/DD format)"),
			searchType: z
				.enum(["name", "email", "birthday", "any"])
				.default("any")
				.describe("Type of search to perform"),
		}),
		execute: async ({ query, searchType }) => {
			try {
				logToolCall("searchRecipients", "execute", { query, searchType });

				const convex = await getAuthenticatedConvexClient();

				// Map search type to parameters
				const searchParams: {
					name?: string;
					email?: string;
					birthday?: string;
				} = {};

				if (searchType === "name" || searchType === "any") {
					searchParams.name = query;
				}
				if (searchType === "email" || searchType === "any") {
					searchParams.email = query;
				}
				if (searchType === "birthday" || searchType === "any") {
					searchParams.birthday = query;
				}

				const result = await searchRecipients(convex, searchParams);

				if (!result.success) {
					throw new Error(result.error || "Failed to search recipients");
				}

				logAI(
					LogLevel.INFO,
					LogCategory.TOOL_CALL,
					"recipients_search_completed",
					{
						totalFound: result.recipients?.length || 0,
						query,
						searchType,
					}
				);

				return {
					success: true,
					recipients: result.recipients || [],
					message:
						result.message ||
						`Found ${result.recipients?.length || 0} contact${(result.recipients?.length || 0) !== 1 ? "s" : ""} matching "${query}".`,
					searchQuery: query,
				};
			} catch (error) {
				logAI(
					LogLevel.ERROR,
					LogCategory.TOOL_CALL,
					"search_recipients_error",
					{
						error: error instanceof Error ? error.message : String(error),
					}
				);
				return handleToolError(error);
			}
		},
	}),
};
