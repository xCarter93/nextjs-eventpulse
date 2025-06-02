import { z } from "zod";
import { tool } from "ai";
import { searchRecipients } from "../server-actions";
import { ConvexHttpClient } from "convex/browser";
import {
	logAI,
	logError,
	logToolCall,
	LogLevel,
	LogCategory,
} from "../logging";

// Enhanced validation schemas
const SearchTypeEnum = z.enum(["name", "email", "birthday", "any"]);
const SearchQuerySchema = z.string().min(1, "Search query is required").max(200, "Search query is too long");
const SessionIdSchema = z.string().min(1, "Session ID is required");

// Custom error types
class SearchValidationError extends Error {
	constructor(message: string, public field: string) {
		super(message);
		this.name = "SearchValidationError";
	}
}

// Utility functions
const sanitizeSearchQuery = (query: string): string => {
	return query.trim().replace(/[<>\"'&]/g, "");
};

const detectSearchType = (query: string): "name" | "email" | "birthday" | "any" => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const birthdayRegex = /^\d{1,2}\/\d{1,2}(?:\/\d{4})?$/;
	
	if (emailRegex.test(query)) return "email";
	if (birthdayRegex.test(query)) return "birthday";
	return "name";
};

interface Recipient {
	name: string;
	email: string;
	birthday?: number | string;
	[key: string]: unknown;
}

const formatSearchResults = (recipients: Recipient[], searchQuery: string, searchType: string) => {
	if (recipients.length === 0) {
		return `No recipients found matching "${searchQuery}" in ${searchType === "any" ? "any field" : searchType}.`;
	}

	const resultText = recipients.length === 1 ? "1 recipient found" : `${recipients.length} recipients found`;
	const results = recipients.map((recipient, index) => {
		const birthday = recipient.birthday 
			? (typeof recipient.birthday === 'number' 
				? new Date(recipient.birthday).toLocaleDateString() 
				: recipient.birthday)
			: "Not set";
		return `${index + 1}. **${recipient.name}**\n   📧 ${recipient.email}\n   🎂 ${birthday}`;
	}).join("\n\n");

	return `${resultText} matching "${searchQuery}":\n\n${results}`;
};

/**
 * Optimized tool for searching recipients with enhanced validation and better UX
 */
export const optimizedSearchRecipientsTool = tool({
	description: "Search for recipients/contacts with smart query detection and comprehensive results",
	parameters: z.object({
		searchQuery: SearchQuerySchema.describe(
			"The search query. Can be a name, email, or birthday (MM/DD or MM/DD/YYYY format). Examples: 'John Smith', 'john@email.com', '10/15'"
		),
		searchType: SearchTypeEnum.describe(
			"Type of search to perform. Use 'any' for auto-detection based on query format"
		),
		sessionId: SessionIdSchema.describe("Session ID to track this search request"),
	}),
	execute: async ({ searchQuery, searchType, sessionId }) => {
		try {
			logToolCall("optimizedSearchRecipientsTool", "execute", {
				searchQuery: `[${searchQuery.length} chars]`,
				searchType,
				sessionId,
			});

			// Sanitize and validate input
			const sanitizedQuery = sanitizeSearchQuery(searchQuery);
			if (!sanitizedQuery) {
				throw new SearchValidationError("Search query cannot be empty", "searchQuery");
			}

			// Auto-detect search type if set to "any"
			const finalSearchType = searchType === "any" ? detectSearchType(sanitizedQuery) : searchType;
			
			logAI(
				LogLevel.DEBUG,
				LogCategory.TOOL_CALL,
				"search_type_determined",
				{ query: sanitizedQuery, detectedType: finalSearchType }
			);

			// Initialize Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);

			// Build search parameters based on type
			const searchParams: {
				name?: string;
				email?: string;
				birthday?: string;
			} = {};

			switch (finalSearchType) {
				case "name":
					searchParams.name = sanitizedQuery;
					break;
				case "email":
					searchParams.email = sanitizedQuery;
					break;
				case "birthday":
					searchParams.birthday = sanitizedQuery;
					break;
				case "any":
					// Search all fields
					searchParams.name = sanitizedQuery;
					searchParams.email = sanitizedQuery;
					searchParams.birthday = sanitizedQuery;
					break;
			}

			// Perform search
			const result = await searchRecipients(convex, searchParams);

			if (!result.success) {
				if (result.error?.includes("authentication") || 
					result.error?.includes("logged in")) {
					throw new Error("Authentication required. Please log in to search recipients.");
				}
				throw new Error(result.error || "Search failed");
			}

			// Format results for better display
			const formattedMessage = formatSearchResults(
				result.recipients || [], 
				sanitizedQuery, 
				finalSearchType
			);

			// Add helpful suggestions for empty results
			let suggestions = "";
			if (result.count === 0) {
				suggestions = "\n\n💡 **Search tips:**\n";
				suggestions += "• Try searching with just the first name\n";
				suggestions += "• Check the spelling\n";
				suggestions += "• Use MM/DD format for birthdays (e.g., '10/15')\n";
				suggestions += "• Try searching by email domain (e.g., 'gmail.com')";
			}

			return {
				status: "success",
				message: formattedMessage + suggestions,
				recipients: result.recipients,
				count: result.count,
				searchType: finalSearchType,
				originalQuery: sanitizedQuery,
				sessionId,
			};

		} catch (error) {
			logError(LogCategory.TOOL_CALL, "optimized_search_recipients_error", error);

			if (error instanceof SearchValidationError) {
				return {
					status: "error",
					message: error.message,
					field: error.field,
					sessionId,
				};
			}

			let errorMessage = "There was an error searching for recipients.";
			
			if (error instanceof Error) {
				if (error.message.includes("authentication")) {
					errorMessage = "You need to be logged in to search recipients. Please log in and try again.";
				} else if (error.message.includes("network") || error.message.includes("timeout")) {
					errorMessage = "Network error occurred. Please check your connection and try again.";
				} else {
					errorMessage = error.message;
				}
			}

			return {
				status: "error",
				message: errorMessage,
				sessionId,
			};
		}
	},
});