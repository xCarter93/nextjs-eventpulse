import { type SubscriptionLevel, getSubscriptionLimits } from "./subscriptions";

export function canAddRecipient(
	currentCount: number,
	level: SubscriptionLevel
): boolean {
	const limits = getSubscriptionLimits(level);
	return currentCount < limits.maxRecipients;
}

export function canScheduleForDate(
	scheduledDate: Date,
	level: SubscriptionLevel
): boolean {
	const limits = getSubscriptionLimits(level);
	const daysInFuture = Math.floor(
		(scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
	);
	return daysInFuture <= limits.maxScheduleDaysInAdvance;
}

export function canAddCustomEvents(level: SubscriptionLevel): boolean {
	return getSubscriptionLimits(level).canAddCustomEvents;
}

export function canViewMap(level: SubscriptionLevel): boolean {
	return getSubscriptionLimits(level).canViewMap;
}

export function canCustomizeReminderDays(level: SubscriptionLevel): boolean {
	return getSubscriptionLimits(level).canCustomizeReminderDays;
}

export function canCustomizeEventWindow(level: SubscriptionLevel): boolean {
	return getSubscriptionLimits(level).canCustomizeEventWindow;
}

export function getMaxUpcomingEvents(level: SubscriptionLevel): number {
	return getSubscriptionLimits(level).maxUpcomingEvents;
}

export function getAnimationExpirationDate(
	level: SubscriptionLevel
): Date | null {
	const limits = getSubscriptionLimits(level);
	if (limits.maxAnimationStorageDays === Infinity) return null;

	const expirationDate = new Date();
	expirationDate.setDate(
		expirationDate.getDate() + limits.maxAnimationStorageDays
	);
	return expirationDate;
}

export function getReminderDays(
	userPreference: number | undefined,
	level: SubscriptionLevel
): number {
	const limits = getSubscriptionLimits(level);
	if (!limits.canCustomizeReminderDays) return limits.defaultReminderDays;
	return userPreference ?? limits.defaultReminderDays;
}

export function getEventLookAheadDays(
	userPreference: number | undefined,
	level: SubscriptionLevel
): number {
	const limits = getSubscriptionLimits(level);
	if (!limits.canCustomizeEventWindow) return limits.defaultEventLookAheadDays;
	return userPreference ?? limits.defaultEventLookAheadDays;
}
