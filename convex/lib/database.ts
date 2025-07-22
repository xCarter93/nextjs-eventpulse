import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";
import { api } from "../_generated/api";
import { getSubscriptionLimits } from "../../src/lib/subscriptions";

/**
 * Database constants and utilities for reducing code duplication.
 * This follows Convex best practices for consistent query patterns.
 */

/**
 * Common index names used across the application
 */
export const INDEX_NAMES = {
	BY_USER_ID: "by_userId",
	BY_TOKEN_IDENTIFIER: "by_tokenIdentifier",
	BY_EXPIRATION: "by_expiration",
	BY_STRIPE_CUSTOMER_ID: "by_stripeCustomerId",
	BY_STRIPE_SUBSCRIPTION_ID: "by_stripeSubscriptionId",
} as const;

/**
 * Default pagination constants
 */
export const PAGINATION = {
	DEFAULT_PAGE_SIZE: 50,
	MAX_PAGE_SIZE: 100,
} as const;

/**
 * Common error messages for consistent error handling
 */
export const DB_ERRORS = {
	NOT_AUTHENTICATED: "Not authenticated",
	USER_NOT_FOUND: "User not found",
	ACCESS_DENIED: "Access denied",
	RESOURCE_NOT_FOUND: "Resource not found or access denied",
	LIMIT_EXCEEDED: "You have reached your limit for this resource",
} as const;

/**
 * Common pagination helper
 */
export function getPageSize(requestedSize?: number): number {
	return Math.min(
		requestedSize || PAGINATION.DEFAULT_PAGE_SIZE,
		PAGINATION.MAX_PAGE_SIZE
	);
}

/**
 * Get user by token identifier - commonly used pattern across many functions
 */
export async function getUserByTokenIdentifier(
	ctx: QueryCtx | MutationCtx,
	tokenIdentifier: string
): Promise<Doc<"users"> | null> {
	return await ctx.db
		.query("users")
		.withIndex(INDEX_NAMES.BY_TOKEN_IDENTIFIER, (q: any) =>
			q.eq("tokenIdentifier", tokenIdentifier)
		)
		.first();
}

/**
 * Get all resources for a user by type - common pattern across many queries
 */
export async function getUserResources<T extends "recipients" | "groups" | "customEvents" | "audioFiles">(
	ctx: QueryCtx,
	table: T,
	userId: Id<"users">
): Promise<Doc<T>[]> {
	return await ctx.db
		.query(table)
		.withIndex(INDEX_NAMES.BY_USER_ID, (q: any) => q.eq("userId", userId))
		.collect();
}

/**
 * Check subscription limits for a user - common pattern across mutations
 */
export async function checkSubscriptionLimit(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	resourceType: "recipients",
	currentCount: number
): Promise<void> {
	const subscriptionLevel = await ctx.runQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const limits = getSubscriptionLimits(subscriptionLevel);

	let maxAllowed: number;
	let errorMessage: string;

	switch (resourceType) {
		case "recipients":
			maxAllowed = limits.maxRecipients;
			errorMessage = "You have reached your recipient limit. Upgrade to Pro for unlimited recipients.";
			break;
		default:
			throw new ConvexError("Invalid resource type");
	}

	if (currentCount >= maxAllowed) {
		throw new ConvexError(errorMessage);
	}
}

/**
 * Validate resource ownership - common pattern across mutations
 */
export async function validateResourceOwnership<T extends "recipients" | "groups" | "customEvents" | "audioFiles">(
	ctx: QueryCtx | MutationCtx,
	table: T,
	resourceId: Id<T>,
	userId: Id<"users">
): Promise<Doc<T>> {
	const resource = await ctx.db.get(resourceId);
	
	if (!resource || resource.userId !== userId) {
		throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
	}
	
	return resource;
}
