import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Get the current authenticated user or throw an error if not authenticated.
 * This is the standard pattern for mutations that require authentication.
 *
 * @param ctx - The query or mutation context
 * @returns Promise<Doc<"users">> - The authenticated user document
 * @throws ConvexError if not authenticated or user not found
 */
export async function getCurrentUser(
	ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) {
		throw new ConvexError("Not authenticated");
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.first();

	if (!user) {
		throw new ConvexError("User not found");
	}

	return user;
}

/**
 * Get the current authenticated user or return null if not authenticated.
 * This is the standard pattern for queries that should return empty results
 * when the user is not authenticated, rather than throwing an error.
 *
 * @param ctx - The query context
 * @returns Promise<Doc<"users"> | null> - The authenticated user document or null
 */
export async function getCurrentUserOrNull(
	ctx: QueryCtx
): Promise<Doc<"users"> | null> {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) {
		return null;
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.first();

	return user;
}

/**
 * Authorize access to a group resource by checking ownership.
 * Validates that the current authenticated user owns the requested group.
 *
 * @param ctx - The query or mutation context
 * @param groupId - The ID of the group to authorize
 * @returns Promise<{user: Doc<"users">, group: Doc<"groups">}> - The user and group if authorized
 * @throws ConvexError if not authenticated, user not found, or access denied
 */
export async function authorizeGroupAccess(
	ctx: QueryCtx | MutationCtx,
	groupId: Id<"groups">
): Promise<{
	user: Doc<"users">;
	group: Doc<"groups">;
}> {
	const user = await getCurrentUser(ctx);

	const group = await ctx.db.get(groupId);
	if (!group || group.userId !== user._id) {
		throw new ConvexError(AUTH_ERRORS.RESOURCE_NOT_FOUND);
	}

	return { user, group };
}

/**
 * Authorize access to a recipient resource by checking ownership.
 * Validates that the current authenticated user owns the requested recipient.
 *
 * @param ctx - The query or mutation context
 * @param recipientId - The ID of the recipient to authorize
 * @returns Promise<{user: Doc<"users">, recipient: Doc<"recipients">}> - The user and recipient if authorized
 * @throws ConvexError if not authenticated, user not found, or access denied
 */
export async function authorizeRecipientAccess(
	ctx: QueryCtx | MutationCtx,
	recipientId: Id<"recipients">
): Promise<{
	user: Doc<"users">;
	recipient: Doc<"recipients">;
}> {
	const user = await getCurrentUser(ctx);

	const recipient = await ctx.db.get(recipientId);
	if (!recipient || recipient.userId !== user._id) {
		throw new ConvexError(AUTH_ERRORS.RESOURCE_NOT_FOUND);
	}

	return { user, recipient };
}

/**
 * Authorize access to an event resource by checking ownership.
 * Validates that the current authenticated user owns the requested event.
 *
 * @param ctx - The query or mutation context
 * @param eventId - The ID of the event to authorize
 * @returns Promise<{user: Doc<"users">, event: Doc<"customEvents">}> - The user and event if authorized
 * @throws ConvexError if not authenticated, user not found, or access denied
 */
export async function authorizeEventAccess(
	ctx: QueryCtx | MutationCtx,
	eventId: Id<"customEvents">
): Promise<{
	user: Doc<"users">;
	event: Doc<"customEvents">;
}> {
	const user = await getCurrentUser(ctx);

	const event = await ctx.db.get(eventId);
	if (!event || event.userId !== user._id) {
		throw new ConvexError(AUTH_ERRORS.RESOURCE_NOT_FOUND);
	}

	return { user, event };
}

/**
 * Authorize access to an audio file resource by checking ownership.
 * Validates that the current authenticated user owns the requested audio file.
 *
 * @param ctx - The query or mutation context
 * @param audioFileId - The ID of the audio file to authorize
 * @returns Promise<{user: Doc<"users">, audioFile: Doc<"audioFiles">}> - The user and audio file if authorized
 * @throws ConvexError if not authenticated, user not found, or access denied
 */
export async function authorizeAudioFileAccess(
	ctx: QueryCtx | MutationCtx,
	audioFileId: Id<"audioFiles">
): Promise<{
	user: Doc<"users">;
	audioFile: Doc<"audioFiles">;
}> {
	const user = await getCurrentUser(ctx);

	const audioFile = await ctx.db.get(audioFileId);
	if (!audioFile || audioFile.userId !== user._id) {
		throw new ConvexError(AUTH_ERRORS.RESOURCE_NOT_FOUND);
	}

	return { user, audioFile };
}

/**
 * Error messages for consistent error handling across the application
 */
export const AUTH_ERRORS = {
	NOT_AUTHENTICATED: "Not authenticated",
	USER_NOT_FOUND: "User not found",
	ACCESS_DENIED: "Access denied",
	RESOURCE_NOT_FOUND: "Resource not found or access denied",
} as const;
