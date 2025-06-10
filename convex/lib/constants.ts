/**
 * Application constants and default values to reduce duplication.
 * This follows best practices for maintaining consistent values across the codebase.
 */

/**
 * Default user settings and values
 */
export const DEFAULT_USER_SETTINGS = {
	LAST_SIGNED_IN_DATE: () => Date.now(),
	HAS_SEEN_TOUR: false,
	CALENDAR: {
		SHOW_HOLIDAYS: true,
	},
	UPCOMING_EVENTS: {
		DAYS_TO_SHOW: 30,
		MAX_EVENTS: 10,
	},
	NOTIFICATIONS: {
		REMINDER_DAYS: 7,
		EMAIL_REMINDERS: {
			EVENTS: true,
			BIRTHDAYS: true,
			HOLIDAYS: false,
		},
	},
} as const;

/**
 * Subscription tier limits (duplicated between client and server)
 */
export const SUBSCRIPTION_LIMITS = {
	FREE: {
		MAX_RECIPIENTS: 5,
		MAX_ANIMATIONS: 10,
		MAX_SCHEDULE_DAYS_IN_ADVANCE: 7,
		CAN_ADD_CUSTOM_EVENTS: false,
		CAN_VIEW_MAP: false,
		CAN_CUSTOMIZE_REMINDER_DAYS: false,
		DEFAULT_REMINDER_DAYS: 7,
		CAN_CUSTOMIZE_EVENT_WINDOW: false,
		DEFAULT_EVENT_LOOK_AHEAD_DAYS: 30,
		MAX_UPCOMING_EVENTS: 5,
	},
	PRO: {
		MAX_RECIPIENTS: Infinity,
		MAX_ANIMATIONS: Infinity,
		MAX_SCHEDULE_DAYS_IN_ADVANCE: Infinity,
		CAN_ADD_CUSTOM_EVENTS: true,
		CAN_VIEW_MAP: true,
		CAN_CUSTOMIZE_REMINDER_DAYS: true,
		DEFAULT_REMINDER_DAYS: 7,
		CAN_CUSTOMIZE_EVENT_WINDOW: true,
		DEFAULT_EVENT_LOOK_AHEAD_DAYS: 30,
		MAX_UPCOMING_EVENTS: Infinity,
	},
} as const;

/**
 * Common error messages for consistent user experience
 */
export const COMMON_ERRORS = {
	NETWORK_ERROR:
		"Network error occurred. Please check your connection and try again.",
	AUTH_REQUIRED:
		"You need to be logged in to perform this action. Please log in and try again.",
	GENERIC_ERROR: "An unexpected error occurred. Please try again.",
	INVALID_INPUT: "The provided input is invalid. Please check and try again.",
	RESOURCE_NOT_FOUND: "The requested resource was not found.",
	PERMISSION_DENIED: "You don't have permission to perform this action.",
} as const;

/**
 * Date and time constants
 */
export const DATE_TIME = {
	MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
	DAYS_PER_YEAR: 365,
	VALID_YEAR_RANGE: {
		MIN: 1900,
		MAX: () => new Date().getFullYear(),
	},
} as const;

/**
 * Validation constants
 */
export const VALIDATION = {
	EMAIL: {
		MIN_LENGTH: 5,
		MAX_LENGTH: 254,
	},
	NAME: {
		MIN_LENGTH: 1,
		MAX_LENGTH: 100,
	},
	SEARCH_QUERY: {
		MIN_LENGTH: 1,
		MAX_LENGTH: 200,
	},
	EVENT_NAME: {
		MIN_LENGTH: 1,
		MAX_LENGTH: 100,
	},
} as const;
