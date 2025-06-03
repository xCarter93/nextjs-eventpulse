import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

// Schema for determining which tool to use
const toolSelectionSchema = z.object({
	toolToUse: z
		.enum([
			"createRecipient",
			"searchRecipients",
			"getRecipients",
			"getUpcomingEvents",
			"createEvent",
			"none",
		])
		.describe("The tool that should be used based on the user's request"),
	reason: z
		.string()
		.describe("A brief explanation of why this tool was selected"),
});

// Schema for createRecipient tool parameters
const createRecipientSchema = z.object({
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
		.describe("The recipient's email address (can be empty for some steps)"),
	birthday: z
		.string()
		.describe(
			"The recipient's birthday in MM/DD/YYYY format (can be empty for some steps)"
		),
});

// Schema for searchRecipients tool parameters
const searchRecipientsSchema = z.object({
	searchQuery: z
		.string()
		.describe("The text to search for (name, email, or birthday value)"),
	searchType: z
		.enum(["name", "email", "birthday", "any"])
		.describe("The type of search to perform"),
});

// Schema for getRecipients tool parameters
const getRecipientsSchema = z.object({
	showDetails: z
		.boolean()
		.describe(
			"Whether to show detailed information for each recipient (true) or just the count (false)"
		),
});

// Enhanced schema for getUpcomingEvents tool parameters with more structured date range
const getUpcomingEventsSchema = z.object({
	dateRange: z
		.object({
			description: z
				.string()
				.describe(
					"The original date range description from the user's message"
				),
			startDate: z
				.string()
				.describe("The start date in ISO format (YYYY-MM-DD)"),
			endDate: z.string().describe("The end date in ISO format (YYYY-MM-DD)"),
			relativeDescription: z
				.string()
				.describe(
					"A human-readable description of the date range (e.g., 'next month', 'next 30 days')"
				),
		})
		.describe("A structured representation of the date range"),
	includeTypes: z
		.enum(["all", "birthdays", "events"])
		.describe("What types of events to include"),
	searchTerm: z
		.string()
		.describe(
			"Search term to filter events by name or person (can be empty string)"
		),
});

// Schema for createEvent tool parameters
const createEventSchema = z.object({
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
			"The event date in any format - natural language is preferred (can be empty for some steps)"
		),
	isRecurring: z
		.boolean()
		.describe(
			"Whether the event recurs annually (default false for single-prompt creation)"
		),
});

/**
 * Determines which tool should be used based on the user's message
 * @param userMessage The user's message
 * @returns An object containing the tool to use and the reason
 */
export async function determineToolToUse(userMessage: string) {
	try {
		const { object } = await generateObject({
			model: openai("o3-mini"),
			schema: toolSelectionSchema,
			prompt: `Based on the following user message, determine which tool should be used.
      
User message: "${userMessage}"

Available tools:
1. createRecipient - Use when the user wants to create a new recipient/contact
2. searchRecipients - Use when the user wants to search for existing recipients/contacts with specific criteria
3. getRecipients - Use when the user wants to know how many recipients they have, see all recipients, or get a list of all their contacts
4. getUpcomingEvents - Use when the user wants to see upcoming events or birthdays
5. createEvent - Use when the user wants to create a new event
6. none - Use when the user's request doesn't require any of the above tools

Guidelines:
- Use "getRecipients" for questions like "how many recipients do I have?", "list all my contacts", "show me all my recipients"
- Use "searchRecipients" for specific searches like "find John Smith", "contacts with gmail addresses", "birthdays in October"
- Use "createRecipient" when they want to add a new contact
- Use "createEvent" when they want to create a new event, add an event to their calendar, or schedule something

Determine which tool should be used, if any.`,
		});

		return object;
	} catch (error) {
		console.error("Error determining tool to use:", error);
		return {
			toolToUse: "none" as const,
			reason: "Failed to determine which tool to use due to an error",
		};
	}
}

/**
 * Parses the user's message into structured data for the createRecipient tool
 * @param userMessage The user's message
 * @param currentStep The current step in the recipient creation process
 * @returns Structured data for the createRecipient tool
 */
export async function parseCreateRecipientData(
	userMessage: string,
	currentStep: string = "start",
	existingData: Record<string, string> = {}
) {
	try {
		const { object } = await generateObject({
			model: openai("o3-mini"),
			schema: createRecipientSchema,
			prompt: `Parse the following user message for creating a recipient.
      
User message: "${userMessage}"
Current step: ${currentStep}
Existing data: ${JSON.stringify(existingData)}

Extract the relevant information for the createRecipient tool.`,
		});

		return object;
	} catch (error) {
		console.error("Error parsing createRecipient data:", error);
		return {
			step: currentStep as
				| "start"
				| "collect-name"
				| "collect-email"
				| "collect-birthday"
				| "confirm"
				| "submit",
			name: existingData.name || "",
			email: existingData.email || "",
			birthday: existingData.birthday || "",
		};
	}
}

/**
 * Parses the user's message into structured data for the searchRecipients tool
 * @param userMessage The user's message
 * @returns Structured data for the searchRecipients tool
 */
export async function parseSearchRecipientsData(userMessage: string) {
	try {
		const { object } = await generateObject({
			model: openai("o3-mini"),
			schema: searchRecipientsSchema,
			prompt: `Parse the following user message for searching recipients.
      
User message: "${userMessage}"

Extract the search query and search type from the user's message.
If the user is looking for contacts with a specific name, use searchType="name".
If the user is looking for contacts with a specific email or domain, use searchType="email".
If the user is looking for contacts with birthdays in a specific month or date, use searchType="birthday".
If the search type is not clear, use searchType="any".`,
		});

		return object;
	} catch (error) {
		console.error("Error parsing searchRecipients data:", error);
		return {
			searchQuery: "",
			searchType: "any" as const,
		};
	}
}

/**
 * Parses the user's message into structured data for the getRecipients tool
 * @param userMessage The user's message
 * @returns Structured data for the getRecipients tool
 */
export async function parseGetRecipientsData(userMessage: string) {
	try {
		const { object } = await generateObject({
			model: openai("o3-mini"),
			schema: getRecipientsSchema,
			prompt: `Parse the following user message for getting recipients information.
      
User message: "${userMessage}"

Determine if the user wants detailed information (showDetails=true) or just a count (showDetails=false).

Use showDetails=true when the user asks to:
- "list all my contacts"
- "show me all my recipients"
- "what are my contacts"
- "display my recipients"

Use showDetails=false when the user asks:
- "how many recipients do I have?"
- "how many contacts do I have?"
- "what's my contact count?"
- "do I have any recipients?"`,
		});

		return object;
	} catch (error) {
		console.error("Error parsing getRecipients data:", error);
		return {
			showDetails: false,
		};
	}
}

/**
 * Parses the user's message into structured data for the getUpcomingEvents tool
 * @param userMessage The user's message
 * @returns Structured data for the getUpcomingEvents tool
 */
export async function parseGetUpcomingEventsData(userMessage: string) {
	try {
		const { object } = await generateObject({
			model: openai("o3-mini"),
			schema: getUpcomingEventsSchema,
			prompt: `Parse the following user message for retrieving upcoming events.
      
User message: "${userMessage}"

Extract the date range, event types, and search term from the user's message.

For the date range:
1. Identify the natural language description (e.g., "within a month from now", "next week")
2. Convert it to explicit start and end dates in ISO format (YYYY-MM-DD)
3. Today's date is ${new Date().toISOString().split("T")[0]}

For example:
- "next week" would have startDate = today's date and endDate = 7 days from today
- "next month" would have startDate = today's date and endDate = 30 days from today
- "within 3 months" would have startDate = today's date and endDate = 90 days from today
- "from June 1 to July 15" would have explicit dates for both start and end

For event types:
- If the user doesn't specify event types, use includeTypes="all"
- If the user specifically asks for birthdays, use includeTypes="birthdays"
- If the user specifically asks for events (not birthdays), use includeTypes="events"

For search term:
- Extract any specific names, events, or keywords the user is looking for
- For example, if they ask "When is Amanda's wedding?", the search term would be "Amanda wedding"
- If no specific search term is mentioned, provide an empty string

Provide a complete structured response with all fields filled in.`,
		});

		return object;
	} catch (error) {
		console.error("Error parsing getUpcomingEvents data:", error);
		// Create a fallback with today's date and 30 days from now
		const today = new Date();
		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(today.getDate() + 30);

		return {
			dateRange: {
				description: "next month",
				startDate: today.toISOString().split("T")[0],
				endDate: thirtyDaysFromNow.toISOString().split("T")[0],
				relativeDescription: "next month",
			},
			includeTypes: "all" as const,
			searchTerm: "",
		};
	}
}

/**
 * Parses the user's message into structured data for the createEvent tool
 * @param userMessage The user's message
 * @param currentStep The current step in the event creation process
 * @returns Structured data for the createEvent tool
 */
export async function parseCreateEventData(
	userMessage: string,
	currentStep: string = "start",
	existingData: Record<string, string | boolean> = {}
) {
	try {
		const { object } = await generateObject({
			model: openai("o3-mini"),
			schema: createEventSchema,
			prompt: `Parse the following user message for creating an event.
      
User message: "${userMessage}"
Current step: ${currentStep}
Existing data: ${JSON.stringify(existingData)}

Extract the relevant information for the createEvent tool.

For single-prompt event creation (when all information is provided at once):
- If the user provides an event name and date in one message, extract both
- For the date, preserve the EXACT natural language expression (e.g., "this thursday", "next week", "March 18, 2025")
- Default isRecurring to false unless the user explicitly mentions it's recurring/annual
- If all information is present, you can go directly to the submit step

Guidelines:
- Event name: Extract the event name from the message
- Date: Keep the exact date expression as provided by the user
- isRecurring: Only set to true if user mentions "annual", "yearly", "recurring", or similar`,
		});

		return object;
	} catch (error) {
		console.error("Error parsing createEvent data:", error);
		return {
			step: currentStep as
				| "start"
				| "collect-name"
				| "collect-date"
				| "collect-recurring"
				| "confirm"
				| "submit",
			name: existingData.name || "",
			date: existingData.date || "",
			isRecurring: existingData.isRecurring || false,
		};
	}
}

/**
 * Main function to parse a user message into structured data for the appropriate tool
 * @param userMessage The user's message
 * @returns An object containing the tool to use and the structured data for that tool
 */
export async function parseUserMessage(userMessage: string) {
	// First, determine which tool to use
	const { toolToUse, reason } = await determineToolToUse(userMessage);

	// Then, parse the message for the specific tool
	let structuredData = null;

	switch (toolToUse) {
		case "createRecipient":
			structuredData = await parseCreateRecipientData(userMessage);
			break;
		case "searchRecipients":
			structuredData = await parseSearchRecipientsData(userMessage);
			break;
		case "getRecipients":
			structuredData = await parseGetRecipientsData(userMessage);
			break;
		case "getUpcomingEvents":
			structuredData = await parseGetUpcomingEventsData(userMessage);
			break;
		case "createEvent":
			structuredData = await parseCreateEventData(userMessage);
			break;
		case "none":
		default:
			structuredData = null;
			break;
	}

	return {
		toolToUse,
		reason,
		structuredData,
	};
}
