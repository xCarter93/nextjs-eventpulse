"use client";

import { UserStats } from "../dashboard/UserStats";
import { UpcomingEvents } from "../dashboard/UpcomingEvents";
import { QuickActions } from "../dashboard/QuickActions";
import { useSidebarAccordionState } from "@/hooks/useSidebarAccordionState";

export function DashboardStats() {
	const { updateAccordionState, getAccordionState, isLoaded } =
		useSidebarAccordionState();

	if (!isLoaded) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse space-y-4">
					<div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
					<div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
					<div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<UserStats
				selectedKeys={getAccordionState("userStats")}
				onSelectionChange={(keys) => updateAccordionState("userStats", keys)}
			/>
			<UpcomingEvents
				selectedKeys={getAccordionState("upcomingEvents")}
				onSelectionChange={(keys) =>
					updateAccordionState("upcomingEvents", keys)
				}
			/>
			<QuickActions
				selectedKeys={getAccordionState("quickActions")}
				onSelectionChange={(keys) => updateAccordionState("quickActions", keys)}
			/>
		</div>
	);
}
