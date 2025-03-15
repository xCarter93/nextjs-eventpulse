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
		sessionId: z
			.string()
			.describe("Session ID to track this specific tool flow"),
	}),
	execute: async ({
		searchQuery,
		searchType,
		sessionId,
	}: {
		searchQuery: string;
		searchType: "name" | "email" | "birthday" | "any";
		sessionId: string;
	}) => {
		try {
			// Log the tool call
			logToolCall("searchRecipientsTool", "execute", {
				searchQuery,
				searchType,
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
				logAI(
					LogLevel.ERROR,
					LogCategory.TOOL_CALL,
					"search_recipients_error",
					{ error: result.error }
				);
				throw new Error(result.error || "Unknown error searching recipients");
			}

			return {
				status: "success",
				message: result.message,
				recipients: result.recipients,
				count: result.count,
				sessionId: sessionId,
			};
		} catch (error: unknown) {
			logError(LogCategory.TOOL_CALL, "search_recipients_tool_error", error);

			let errorMessage = "There was an error searching for recipients.";

			if (error instanceof Error) {
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
				sessionId: sessionId,
			};
		}
	},
});
