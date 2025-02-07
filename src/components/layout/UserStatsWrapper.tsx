"use client";

import { UserStats } from "@/components/dashboard/UserStats";

export function UserStatsWrapper() {
	return (
		<div className="absolute top-[5.5rem] right-4 sm:right-6 lg:right-8 w-full max-w-sm">
			<UserStats />
		</div>
	);
}
