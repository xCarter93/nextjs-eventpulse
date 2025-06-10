import { QueryCtx, MutationCtx } from "../_generated/server";

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
) {
	return await ctx.db
		.query("users")
		.withIndex(INDEX_NAMES.BY_TOKEN_IDENTIFIER, (q) =>
			q.eq("tokenIdentifier", tokenIdentifier)
		)
		.first();
}
