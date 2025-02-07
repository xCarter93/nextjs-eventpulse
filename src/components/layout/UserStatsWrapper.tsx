"use client";

import { UserStats } from "@/components/dashboard/UserStats";

export function UserStatsWrapper() {
	return (
		<div className="w-full max-w-sm ml-auto mb-6">
			<UserStats />
		</div>
	);
}
