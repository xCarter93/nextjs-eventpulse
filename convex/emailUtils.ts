import { Resend } from "resend";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Shared error messages
export const EMAIL_ERRORS = {
	RECIPIENT_NOT_FOUND: "Recipient not found",
	ANIMATION_NOT_FOUND: "Animation not found",
	ANIMATION_NO_STORAGE: "Animation has no storage ID",
	ANIMATION_URL_FAILED: "Failed to get animation URL",
	EMAIL_SEND_FAILED: "Failed to send email",
	NOT_AUTHENTICATED: "Not authenticated",
	USER_NOT_FOUND: "User not found",
	ACCESS_DENIED: "Access denied",
	USER_EMAIL_REQUIRED: "User email is required",
	INVALID_IMAGE_URL: "Invalid image URL format",
} as const;

// Shared types for email functionality
export type EmailColorScheme = {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
};

export type EmailRecipient = {
	id: Id<"recipients">;
	name: string;
	email: string;
	userId: Id<"users">;
};

// Initialize Resend with environment variable
let resend: Resend;
try {
	const RESEND_API_KEY = process.env.RESEND_API_KEY;
	if (!RESEND_API_KEY) {
		throw new Error("RESEND_API_KEY is not defined in environment variables");
	}
	resend = new Resend(RESEND_API_KEY);
} catch (error) {
	if (error instanceof Error) {
		console.error("Failed to initialize Resend:", error.message);
	}
	throw error;
}

export { resend };

// Shared utility functions
export async function validateImageUrl(url: string): Promise<boolean> {
	return Boolean(url.match(/\.(gif|jpe?g|png)$/i));
}

export const EMAIL_SENDER = "EventPulse <pulse@eventpulse.tech>";

// Retry configuration
export const RETRY_CONFIG = {
	DELAY_MS: 60 * 60 * 1000, // 1 hour
	ERROR_MESSAGE: "RETRY_NEEDED",
};

// Authentication helper
export async function authenticateUser(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new ConvexError(EMAIL_ERRORS.NOT_AUTHENTICATED);
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.first();

	if (!user) {
		throw new ConvexError(EMAIL_ERRORS.USER_NOT_FOUND);
	}

	return { identity, user };
}
