/**
 * Logging utility for AI interactions
 * Provides structured logging for AI chats and tool calls
 */

/**
 * Log levels for different types of messages
 */
export enum LogLevel {
	DEBUG = "debug",
	INFO = "info",
	WARN = "warn",
	ERROR = "error",
}

/**
 * Log categories to organize logs by feature
 */
export enum LogCategory {
	AI_CHAT = "ai_chat",
	TOOL_CALL = "tool_call",
	RECIPIENT = "recipient",
	EVENT = "event",
	AUTH = "auth",
	DATE_PARSING = "date_parsing",
	PERFORMANCE = "performance",
}

/**
 * Interface for structured log entries
 */
interface LogEntry {
	timestamp: string;
	category: LogCategory;
	action: string;
	data?: Record<string, unknown>;
	userId?: string;
	requestId?: string;
}

/**
 * Creates a structured log entry and sends it to the console
 * These logs will appear in the Convex dashboard
 */
export function logAI(
	level: LogLevel,
	category: LogCategory,
	action: string,
	data?: Record<string, unknown>,
	userId?: string,
	requestId?: string
) {
	const logEntry: LogEntry = {
		timestamp: new Date().toISOString(),
		category,
		action,
		data,
		userId,
		requestId,
	};

	const logMessage = `[AI:${category}:${action}] ${JSON.stringify(logEntry, null, 2)}`;

	switch (level) {
		case LogLevel.DEBUG:
			console.debug(logMessage);
			break;
		case LogLevel.INFO:
			console.info(logMessage);
			break;
		case LogLevel.WARN:
			console.warn(logMessage);
			break;
		case LogLevel.ERROR:
			console.error(logMessage);
			break;
		default:
			console.log(logMessage);
	}
}

/**
 * Convenience method for logging tool calls
 */
export function logToolCall(
	toolName: string,
	action: string,
	params: Record<string, unknown>,
	userId?: string,
	requestId?: string
) {
	logAI(
		LogLevel.INFO,
		LogCategory.TOOL_CALL,
		action,
		{
			tool: toolName,
			parameters: params,
		},
		userId,
		requestId
	);
}

/**
 * Convenience method for logging chat interactions
 */
export function logChat(
	message: string,
	isUserMessage: boolean,
	userId?: string,
	requestId?: string
) {
	logAI(
		LogLevel.INFO,
		LogCategory.AI_CHAT,
		isUserMessage ? "user_message" : "ai_response",
		{
			message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
		},
		userId,
		requestId
	);
}

/**
 * Convenience method for logging errors
 */
export function logError(
	category: LogCategory,
	action: string,
	error: unknown,
	userId?: string,
	requestId?: string
) {
	logAI(
		LogLevel.ERROR,
		category,
		action,
		{
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
						}
					: String(error),
		},
		userId,
		requestId
	);
}
