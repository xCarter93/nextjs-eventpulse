import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createRecipient } from "@/utils/server-actions";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { logError, logToolCall, LogCategory } from "@/utils/logging";

// Validation schemas
const recipientSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	email: z.string().email("Please provide a valid email address"),
	birthday: z.string().optional().describe("Birthday in any format (optional)"),
});

// Utility functions
const sanitizeInput = (input: string): string => {
	return input.trim().replace(/[<>\"'&]/g, "");
};

const validateYear = (year: number): boolean => {
	const currentYear = new Date().getFullYear();
	return year >= 1900 && year <= currentYear;
};

const parseBirthday = (birthday: string): number => {
	const cleanBirthday = sanitizeInput(birthday);

	// Try MM/DD/YYYY format first
	const mmddyyyy = cleanBirthday.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (mmddyyyy) {
		const [, month, day, year] = mmddyyyy;
		const monthNum = parseInt(month) - 1; // 0-based months
		const dayNum = parseInt(day);
		const yearNum = parseInt(year);

		const date = new Date(yearNum, monthNum, dayNum);

		// Validate the date components
		if (
			date.getMonth() !== monthNum ||
			date.getDate() !== dayNum ||
			date.getFullYear() !== yearNum
		) {
			throw new Error("Invalid date values");
		}

		if (!validateYear(yearNum)) {
			throw new Error(
				`The year ${yearNum} seems invalid. Please use a year between 1900 and ${new Date().getFullYear()}.`
			);
		}

		return date.getTime();
	}

	// Try natural language parsing
	const parsedDate = new Date(cleanBirthday);
	if (!isNaN(parsedDate.getTime())) {
		if (!validateYear(parsedDate.getFullYear())) {
			throw new Error(
				`The year ${parsedDate.getFullYear()} seems invalid. Please use a year between 1900 and ${new Date().getFullYear()}.`
			);
		}
		return parsedDate.getTime();
	}

	throw new Error(
		"Could not parse birthday. Please use MM/DD/YYYY format or natural language like 'April 20, 1969'"
	);
};

/**
 * Create a new recipient/contact tool
 */
export const createRecipientTool = createTool({
	id: "create-recipient",
	description:
		"Create a new recipient/contact with name, email, and optional birthday. Ask the user for required information if missing.",
	inputSchema: z.object({
		name: z.string().describe("The recipient's name"),
		email: z.string().describe("The recipient's email address"),
		birthday: z
			.string()
			.optional()
			.describe("The recipient's birthday (optional, in any format)"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
		recipientDetails: z
			.object({
				id: z.string(),
				name: z.string(),
				email: z.string(),
				birthday: z.string().optional(),
			})
			.optional(),
	}),
	execute: async ({ context }) => {
		const { name, email, birthday } = context;

		try {
			logToolCall("createRecipientTool", "execute", {
				name: name ? `[${name.length} chars]` : "empty",
				email: email ? `[${email.length} chars]` : "empty",
				birthday: birthday ? `[${birthday.length} chars]` : "empty",
			});

			// Validate required fields
			if (!name || !name.trim()) {
				throw new Error(
					"Recipient name is required. Please provide the recipient's name."
				);
			}

			if (!email || !email.trim()) {
				throw new Error(
					"Email address is required. Please provide the recipient's email address."
				);
			}

			// Sanitize inputs
			const sanitizedName = sanitizeInput(name);
			const sanitizedEmail = sanitizeInput(email);
			const sanitizedBirthday = birthday ? sanitizeInput(birthday) : undefined;

			// Validate inputs
			try {
				recipientSchema.shape.name.parse(sanitizedName);
				recipientSchema.shape.email.parse(sanitizedEmail);
			} catch (error) {
				if (error instanceof z.ZodError) {
					throw new Error(error.errors[0]?.message || "Invalid input");
				}
				throw error;
			}

			// Parse birthday if provided
			let birthdayTimestamp: number | undefined;
			if (sanitizedBirthday && sanitizedBirthday.trim()) {
				try {
					birthdayTimestamp = parseBirthday(sanitizedBirthday);
				} catch (error) {
					throw new Error(
						`Birthday parsing error: ${
							error instanceof Error ? error.message : "Invalid birthday format"
						}`
					);
				}
			}

			// Setup Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);

			// Create the recipient
			const result = await createRecipient(convex, {
				name: sanitizedName,
				email: sanitizedEmail,
				birthday: birthdayTimestamp || 0, // Use 0 as default for no birthday
			});

			if (!result.success) {
				if (
					result.error &&
					(result.error.includes("authentication") ||
						result.error.includes("logged in") ||
						result.error.includes("auth") ||
						result.error.includes("Not authenticated"))
				) {
					throw new Error(
						"Authentication required. Please log in and try again."
					);
				}

				throw new Error(result.error || "Unknown error creating recipient");
			}

			const birthdayText = birthdayTimestamp
				? ` with birthday on ${new Date(birthdayTimestamp).toLocaleDateString()}`
				: "";

			return {
				success: true,
				message: `✅ Successfully created recipient **${sanitizedName}** (${sanitizedEmail})${birthdayText}! They've been added to your contacts.`,
				recipientDetails: {
					id: result.recipientId || "unknown",
					name: sanitizedName,
					email: sanitizedEmail,
					birthday: birthdayTimestamp
						? new Date(birthdayTimestamp).toLocaleDateString()
						: undefined,
				},
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "create_recipient_error", error);

			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";

			// Provide helpful error responses
			if (errorMessage.includes("authentication")) {
				throw new Error(
					"You need to be logged in to create recipients. Please log in and try again."
				);
			}

			if (errorMessage.includes("email")) {
				throw new Error(`Email validation error: ${errorMessage}`);
			}

			if (errorMessage.includes("birthday") || errorMessage.includes("date")) {
				throw new Error(`Birthday parsing error: ${errorMessage}`);
			}

			throw new Error(`Failed to create recipient: ${errorMessage}`);
		}
	},
});

/**
 * Search recipients tool
 */
export const searchRecipientsTool = createTool({
	id: "search-recipients",
	description: "Search recipients/contacts by name, email, or other criteria",
	inputSchema: z.object({
		query: z.string().describe("Search query (name, email, or partial match)"),
		limit: z
			.number()
			.optional()
			.default(10)
			.describe("Maximum number of results to return"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		recipients: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				email: z.string(),
				birthday: z.string().optional(),
			})
		),
		summary: z.string(),
	}),
	execute: async ({ context }) => {
		const { query, limit } = context;

		try {
			logToolCall("searchRecipientsTool", "execute", {
				query: query ? `[${query.length} chars]` : "empty",
				limit,
			});

			// Get the authentication token from Clerk
			const session = await auth();
			const token = await session.getToken({ template: "convex" });

			if (!token) {
				throw new Error(
					"Authentication required. Please log in to search recipients."
				);
			}

			// Setup Convex client with authentication
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);
			convex.setAuth(token);

			// Get all recipients and filter them locally
			const allRecipients = await convex.query(api.recipients.getRecipients);

			if (!allRecipients) {
				throw new Error("Failed to fetch recipients");
			}

			// Filter recipients based on the search query
			const filteredRecipients = allRecipients.filter(
				(recipient: {
					_id: string;
					name: string;
					email: string;
					birthday?: number;
				}) => {
					const searchText = query.toLowerCase();
					return (
						recipient.name.toLowerCase().includes(searchText) ||
						recipient.email.toLowerCase().includes(searchText)
					);
				}
			);

			// Apply limit
			const searchResults = filteredRecipients.slice(0, limit);

			const recipients = searchResults.map(
				(recipient: {
					_id: string;
					name: string;
					email: string;
					birthday?: number;
				}) => ({
					id: recipient._id,
					name: recipient.name,
					email: recipient.email,
					birthday: recipient.birthday
						? new Date(recipient.birthday).toLocaleDateString()
						: undefined,
				})
			);

			const summary = `Found ${recipients.length} recipients matching "${query}"`;

			return {
				success: true,
				recipients,
				summary,
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "search_recipients_error", error);

			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";

			throw new Error(`Failed to search recipients: ${errorMessage}`);
		}
	},
});

/**
 * Get all recipients tool
 */
export const getRecipientsTool = createTool({
	id: "get-recipients",
	description: "Get a list of all recipients/contacts and their count",
	inputSchema: z.object({
		limit: z
			.number()
			.optional()
			.default(50)
			.describe("Maximum number of recipients to return"),
		offset: z
			.number()
			.optional()
			.default(0)
			.describe("Number of recipients to skip"),
		showDetails: z
			.boolean()
			.optional()
			.default(false)
			.describe("Whether to show detailed information for each recipient"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		recipients: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				email: z.string(),
				birthday: z.string().optional(),
			})
		),
		total: z.number(),
		summary: z.string(),
	}),
	execute: async ({ context }) => {
		const { limit, offset, showDetails } = context;

		try {
			logToolCall("getRecipientsTool", "execute", {
				limit,
				offset,
				showDetails,
			});

			// Get the authentication token from Clerk
			const session = await auth();
			const token = await session.getToken({ template: "convex" });

			if (!token) {
				throw new Error(
					"Authentication required. Please log in to view your recipients."
				);
			}

			// Setup Convex client with authentication
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);
			convex.setAuth(token);

			// Get all recipients using the Convex API
			const allRecipients = await convex.query(api.recipients.getRecipients);

			if (!allRecipients) {
				throw new Error("Failed to fetch recipients");
			}

			const total = allRecipients.length;

			// Apply offset and limit
			const recipients = allRecipients
				.slice(offset, offset + limit)
				.map(
					(recipient: {
						_id: string;
						name: string;
						email: string;
						birthday?: number;
					}) => ({
						id: recipient._id,
						name: recipient.name,
						email: recipient.email,
						birthday: recipient.birthday
							? new Date(recipient.birthday).toLocaleDateString()
							: undefined,
					})
				);

			// Create summary message
			let summary: string;
			if (total === 0) {
				summary =
					"You don't have any recipients yet. You can add new recipients to get started!";
			} else if (total === 1) {
				summary = "You have **1 recipient** in your contact list.";
			} else {
				summary = `You have **${total} recipients** in your contact list.`;
			}

			// Add detailed list if requested
			if (showDetails && recipients.length > 0) {
				const detailsList = recipients
					.map((recipient, index) => {
						const birthdayText = recipient.birthday
							? `\n   🎂 ${recipient.birthday}`
							: "";
						return `${index + 1}. **${recipient.name}**\n   📧 ${recipient.email}${birthdayText}`;
					})
					.join("\n\n");

				summary += `\n\n${detailsList}`;
			}

			return {
				success: true,
				recipients,
				total,
				summary,
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "get_recipients_error", error);

			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";

			// Provide helpful error responses
			if (errorMessage.includes("authentication")) {
				throw new Error(
					"You need to be logged in to view your recipients. Please log in and try again."
				);
			}

			throw new Error(`Failed to get recipients: ${errorMessage}`);
		}
	},
});
