export type SubscriptionLevel = "free" | "pro";

export const FREE_TIER_LIMITS = {
	maxRecipients: 5,
	maxAnimationStorageDays: 10,
	maxScheduleDaysInAdvance: 7,
	canAddCustomEvents: false,
	canViewMap: false,
	canCustomizeReminderDays: false,
	defaultReminderDays: 7,
	canCustomizeEventWindow: false,
	defaultEventLookAheadDays: 30,
	maxUpcomingEvents: 5,
} as const;

export const PRO_TIER_LIMITS = {
	maxRecipients: Infinity,
	maxAnimationStorageDays: Infinity,
	maxScheduleDaysInAdvance: Infinity,
	canAddCustomEvents: true,
	canViewMap: true,
	canCustomizeReminderDays: true,
	defaultReminderDays: 7,
	canCustomizeEventWindow: true,
	defaultEventLookAheadDays: 30,
	maxUpcomingEvents: Infinity,
} as const;

export function getSubscriptionLimits(level: SubscriptionLevel) {
	return level === "pro" ? PRO_TIER_LIMITS : FREE_TIER_LIMITS;
}

// Helper to check if a subscription is active
export function isSubscriptionActive(
	subscription: {
		stripeCurrentPeriodEnd: number;
	} | null
): boolean {
	if (!subscription) return false;
	return subscription.stripeCurrentPeriodEnd > Date.now();
}

// Helper to determine subscription level
export function getSubscriptionLevel(
	subscription: {
		stripeCurrentPeriodEnd: number;
	} | null
): SubscriptionLevel {
	return isSubscriptionActive(subscription) ? "pro" : "free";
}
