/**
 * TypeScript definitions for AI Tools
 * Provides consistent typing and better developer experience
 */

// Base tool result interface
export interface ToolResult {
	success: boolean;
	message: string;
}

// Event-related types
export interface EventDetails {
	id?: string;
	name: string;
	date: string;
	isRecurring: boolean;
}

export interface EventToolResult extends ToolResult {
	eventDetails?: EventDetails;
}

// Recipient-related types
export interface RecipientDetails {
	id?: string;
	name: string;
	birthday?: string | null;
	email?: string | null;
	phone?: string | null;
}

export interface RecipientToolResult extends ToolResult {
	recipientDetails?: RecipientDetails;
}

export interface RecipientSearchResult extends ToolResult {
	recipients: RecipientDetails[];
	totalCount: number;
	searchQuery: string;
}

// Generic list result type
export interface ListToolResult<T> extends ToolResult {
	items: T[];
	totalCount: number;
}

// Error types for better error handling
export interface ToolError {
	code: string;
	message: string;
	details?: Record<string, unknown>;
}

// Validation error type
export interface ValidationError extends ToolError {
	code: "VALIDATION_ERROR";
	field: string;
	value?: unknown;
}

// Authentication error type
export interface AuthenticationError extends ToolError {
	code: "AUTHENTICATION_ERROR";
}

// Database error type
export interface DatabaseError extends ToolError {
	code: "DATABASE_ERROR";
}

// Union type for all possible tool errors
export type AnyToolError =
	| ValidationError
	| AuthenticationError
	| DatabaseError
	| ToolError;

// Helper type for tool execution results
export type ToolExecutionResult<T extends ToolResult> = T | never;

// Type guards for error checking
export const isValidationError = (error: unknown): error is ValidationError => {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code: string }).code === "VALIDATION_ERROR"
	);
};

export const isAuthenticationError = (
	error: unknown
): error is AuthenticationError => {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code: string }).code === "AUTHENTICATION_ERROR"
	);
};

export const isDatabaseError = (error: unknown): error is DatabaseError => {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code: string }).code === "DATABASE_ERROR"
	);
};
