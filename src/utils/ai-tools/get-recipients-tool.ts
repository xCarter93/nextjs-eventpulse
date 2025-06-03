import { z } from "zod";
import { tool } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import {
	logAI,
	logError,
	logToolCall,
	LogLevel,
	LogCategory,
} from "../logging";

// Validation schemas
const SessionIdSchema = z.string().min(1, "Session ID is required");

interface Recipient {
	_id: string;
	name: string;
	email: string;
	birthday: number;
	[key: string]: unknown;
}

const formatRecipientsList = (
	recipients: Recipient[],
	showDetails: boolean = false
) => {
	if (recipients.length === 0) {
		return "You don't have any recipients yet. You can add new recipients to get started!";
	}

	const countText =
		recipients.length === 1
			? "You have **1 recipient**"
			: `You have **${recipients.length} recipients**`;

	if (!showDetails) {
		return `${countText} in your contact list.`;
	}

	const list = recipients
		.map((recipient, index) => {
			const birthday = new Date(recipient.birthday).toLocaleDateString();
			return `${index + 1}. **${recipient.name}**\n   📧 ${recipient.email}\n   🎂 ${birthday}`;
		})
		.join("\n\n");

	return `${countText}:\n\n${list}`;
};

/**
 * Tool for getting all recipients and their count
 */
export const getRecipientsTool = tool({
	description:
		"Get all recipients and their count. Use this when users ask 'how many recipients do I have?' or want to see all their contacts.",
	parameters: z.object({
		showDetails: z
			.boolean()
			.describe(
				"Whether to show detailed information for each recipient. Use true for 'list all recipients', false for just the count."
			),
		sessionId: SessionIdSchema.describe("Session ID to track this request"),
	}),
	execute: async ({ showDetails, sessionId }) => {
		try {
			logToolCall("getRecipientsTool", "execute", {
				showDetails,
				sessionId,
			});

			// Get the authentication token from Clerk
			const session = await auth();
			const token = await session.getToken({ template: "convex" });

			if (!token) {
				throw new Error(
					"Authentication required. Please log in to view your recipients."
				);
			}

			// Initialize Convex client
			const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
			if (!convexUrl) {
				throw new Error("Convex configuration error");
			}

			const convex = new ConvexHttpClient(convexUrl);
			convex.setAuth(token);

			// Get all recipients
			const recipients = await convex.query(api.recipients.getRecipients);

			logAI(LogLevel.DEBUG, LogCategory.TOOL_CALL, "recipients_fetched", {
				count: recipients?.length || 0,
			});

			if (!recipients) {
				throw new Error("Failed to fetch recipients");
			}

			// Format the response
			const formattedMessage = formatRecipientsList(recipients, showDetails);

			return {
				status: "success",
				message: formattedMessage,
				recipients: recipients.map((recipient) => ({
					id: recipient._id,
					name: recipient.name,
					email: recipient.email,
					birthday: new Date(recipient.birthday).toLocaleDateString(),
				})),
				count: recipients.length,
				sessionId,
			};
		} catch (error) {
			logError(LogCategory.TOOL_CALL, "get_recipients_error", error);

			let errorMessage = "There was an error fetching your recipients.";

			if (error instanceof Error) {
				if (
					error.message.includes("authentication") ||
					error.message.includes("logged in") ||
					error.message.includes("auth")
				) {
					errorMessage =
						"You need to be logged in to view your recipients. Please log in and try again.";
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

			return {
				status: "error",
				message: errorMessage,
				sessionId,
			};
		}
	},
});
