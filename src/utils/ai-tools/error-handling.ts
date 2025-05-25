export class ToolError extends Error {
	constructor(
		message: string,
		public code: string = "TOOL_ERROR",
		public retryable: boolean = true,
		public details?: unknown
	) {
		super(message);
		this.name = "ToolError";
	}
}

export function handleToolError(error: unknown): {
	success: false;
	error: string;
	code?: string;
	retryable?: boolean;
	details?: unknown;
} {
	if (error instanceof ToolError) {
		return {
			success: false,
			error: error.message,
			code: error.code,
			retryable: error.retryable,
			details: error.details,
		};
	}

	if (error instanceof Error) {
		// Handle specific error types
		if (error.message.includes("Authentication required")) {
			return {
				success: false,
				error: "Please sign in to use this feature.",
				code: "AUTH_REQUIRED",
				retryable: false,
			};
		}

		if (error.message.includes("Network")) {
			return {
				success: false,
				error: "Network error. Please check your connection and try again.",
				code: "NETWORK_ERROR",
				retryable: true,
			};
		}

		if (error.message.includes("rate limit")) {
			return {
				success: false,
				error: "Too many requests. Please wait a moment and try again.",
				code: "RATE_LIMIT",
				retryable: true,
			};
		}

		return {
			success: false,
			error: error.message,
			code: "UNKNOWN_ERROR",
			retryable: true,
		};
	}

	return {
		success: false,
		error: "An unexpected error occurred. Please try again.",
		code: "UNKNOWN_ERROR",
		retryable: true,
	};
}
