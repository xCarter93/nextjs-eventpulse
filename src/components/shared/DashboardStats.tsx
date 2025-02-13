import { UserStats } from "../dashboard/UserStats";
import { UpcomingEvents } from "../dashboard/UpcomingEvents";
import { QuickActions } from "../dashboard/QuickActions";

export function DashboardStats() {
	return (
		<div className="space-y-6">
			<UserStats />
			<UpcomingEvents />
			<QuickActions />
		</div>
	);
}
