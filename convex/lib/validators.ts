import { v } from "convex/values";

/**
 * Shared validators for reuse across schema and function definitions.
 * This follows Convex best practices for avoiding code duplication in validation.
 */

/**
 * Address object validator - used in both user settings and recipient metadata
 */
export const addressValidator = v.object({
	city: v.string(),
	country: v.string(),
	countryCode: v.string(),
	coordinates: v.object({
		latitude: v.number(),
		longitude: v.number(),
	}),
});

/**
 * Recipient address validator - allows optional fields for recipient metadata
 */
export const recipientAddressValidator = v.object({
	city: v.optional(v.string()),
	country: v.optional(v.string()),
	coordinates: v.optional(
		v.object({
			latitude: v.number(),
			longitude: v.number(),
		})
	),
});

/**
 * Calendar settings validator
 */
export const calendarSettingsValidator = v.object({
	showHolidays: v.boolean(),
});

/**
 * Upcoming events settings validator
 */
export const upcomingEventsSettingsValidator = v.object({
	daysToShow: v.number(),
	maxEvents: v.number(),
});

/**
 * Email reminders settings validator
 */
export const emailRemindersValidator = v.object({
	events: v.boolean(),
	birthdays: v.boolean(),
	holidays: v.boolean(),
});

/**
 * Notification settings validator
 */
export const notificationSettingsValidator = v.object({
	reminderDays: v.number(),
	emailReminders: emailRemindersValidator,
});

/**
 * User settings validator - shared between schema.ts and users.ts
 * This is the main settings object that prevents duplication
 */
export const userSettingsValidator = v.object({
	address: v.optional(addressValidator),
	calendar: v.optional(calendarSettingsValidator),
	upcomingEvents: v.optional(upcomingEventsSettingsValidator),
	notifications: v.optional(notificationSettingsValidator),
});

/**
 * Relation type validator for recipient metadata
 */
export const relationValidator = v.union(
	v.literal("friend"),
	v.literal("parent"),
	v.literal("spouse"),
	v.literal("sibling")
);

/**
 * Recipient metadata validator
 */
export const recipientMetadataValidator = v.object({
	relation: v.optional(relationValidator),
	anniversaryDate: v.optional(v.number()),
	notes: v.optional(v.string()),
	nickname: v.optional(v.string()),
	phoneNumber: v.optional(v.string()),
	address: v.optional(recipientAddressValidator),
});
