import { z } from "zod";
import { tool } from "ai";
import { searchRecipients } from "../server-actions";
import { ConvexHttpClient } from "convex/browser";
import {
	logError,
	logToolCall,
	LogLevel,
	LogCategory,
	logAI,
} from "../logging";

// Utility functions
const sanitizeSearchQuery = (query: string): string => {
	return query.trim().replace(/[<>\"'&]/g, "");
};

const detectSearchType = (
	query: string
): "name" | "email" | "birthday" | "any" => {
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

const formatSearchResults = (
	recipients: Recipient[],
	searchQuery: string,
	searchType: string
) => {
	if (recipients.length === 0) {
		return {
			message: `No recipients found matching "${searchQuery}" in ${searchType === "any" ? "any field" : searchType}.`,
			suggestions:
				"\n\n💡 **Search tips:**\n• Try searching with just the first name\n• Check the spelling\n• Use MM/DD format for birthdays (e.g., '10/15')\n• Try searching by email domain (e.g., 'gmail.com')",
		};
	}

	const resultText =
		recipients.length === 1
			? "1 recipient found"
			: `${recipients.length} recipients found`;
	const results = recipients
		.map((recipient, index) => {
			const birthday = recipient.birthday
				? typeof recipient.birthday === "number"
					? new Date(recipient.birthday).toLocaleDateString()
					: recipient.birthday
				: "Not set";
			return `${index + 1}. **${recipient.name}**\n   📧 ${recipient.email}\n   🎂 ${birthday}`;
		})
		.join("\n\n");

	return {
		message: `${resultText} matching "${searchQuery}":\n\n${results}`,
		suggestions: "",
	};
};

/**
 * Simplified tool for searching recipients with smart query detection
 */
export const searchRecipientsTool = tool({
	description:
		"Search for recipients/contacts by name, email, or birthday. Automatically detects search type based on query format.",
	parameters: z.object({
		query: z
			.string()
			.describe(
				"Search query - can be a name, email, or birthday (MM/DD or MM/DD/YYYY format)"
			),
		searchType: z
			.enum(["name", "email", "birthday", "any"])
			.optional()
			.default("any")
			.describe("Type of search (optional - auto-detected if not specified)"),
	}),
	execute: async ({ query, searchType = "any" }) => {
		try {
			logToolCall("searchRecipientsTool", "execute", {
				query: `[${query.length} chars]`,
				searchType,
			});

			// Validate and sanitize input
			const sanitizedQuery = sanitizeSearchQuery(query);
			if (!sanitizedQuery) {
				throw new Error("Search query cannot be empty");
			}

			// Auto-detect search type if set to "any"
			const finalSearchType =
				searchType === "any" ? detectSearchType(sanitizedQuery) : searchType;

			logAI(LogLevel.DEBUG, LogCategory.TOOL_CALL, "search_type_determined", {
				query: sanitizedQuery,
				detectedType: finalSearchType,
			});

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
				if (
					result.error?.includes("authentication") ||
					result.error?.includes("logged in")
				) {
					throw new Error(
						"Authentication required. Please log in to search recipients."
					);
				}
				throw new Error(result.error || "Search failed");
			}

			// Format results for better display
			const formatted = formatSearchResults(
				result.recipients || [],
				sanitizedQuery,
				finalSearchType
			);

			return {
				success: true,
				message: formatted.message + formatted.suggestions,
				recipients: result.recipients,
				count: result.count,
				searchType: finalSearchType,
				originalQuery: sanitizedQuery,
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "search_recipients_error", error);

			let errorMessage = "There was an error searching for recipients.";

			if (error instanceof Error) {
				if (error.message.includes("authentication")) {
					errorMessage =
						"You need to be logged in to search recipients. Please log in and try again.";
				} else if (
					error.message.includes("network") ||
					error.message.includes("timeout")
				) {
					errorMessage =
						"Network error occurred. Please check your connection and try again.";
				} else {
					errorMessage = error.message;
				}
			}

			throw new Error(errorMessage);
		}
	},
});
