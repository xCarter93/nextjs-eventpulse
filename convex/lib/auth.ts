import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { INDEX_NAMES, DB_ERRORS, getUserByTokenIdentifier } from "./database";
import { api } from "../_generated/api";

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
		throw new ConvexError(DB_ERRORS.NOT_AUTHENTICATED);
	}

	const user = await getUserByTokenIdentifier(ctx, identity.tokenIdentifier);

	if (!user) {
		throw new ConvexError(DB_ERRORS.USER_NOT_FOUND);
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

	return await getUserByTokenIdentifier(ctx, identity.tokenIdentifier);
}

/**
 * Get the current user with their subscription information
 * Common pattern used across multiple queries
 */
export async function getCurrentUserWithSubscription(
	ctx: QueryCtx | MutationCtx
): Promise<{
	user: Doc<"users">;
	subscriptionLevel: "free" | "pro";
}> {
	const user = await getCurrentUser(ctx);
	const subscriptionLevel = await ctx.runQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	
	return { user, subscriptionLevel };
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
		throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
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
		throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
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
		throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
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
		throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
	}

	return { user, audioFile };
}

/**
 * Error messages for consistent error handling across the application
 * @deprecated Use DB_ERRORS from database.ts instead
 */
export const AUTH_ERRORS = {
	NOT_AUTHENTICATED: DB_ERRORS.NOT_AUTHENTICATED,
	USER_NOT_FOUND: DB_ERRORS.USER_NOT_FOUND,
	ACCESS_DENIED: DB_ERRORS.ACCESS_DENIED,
	RESOURCE_NOT_FOUND: DB_ERRORS.RESOURCE_NOT_FOUND,
} as const;
