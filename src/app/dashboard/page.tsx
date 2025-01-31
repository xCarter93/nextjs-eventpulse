import { Calendar } from "@/components/dashboard/Calendar";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UserStats } from "@/components/dashboard/UserStats";

export default async function DashboardPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-10rem)]">
				<div className="lg:col-span-2 h-full">
					<Calendar />
				</div>

				<div className="space-y-6">
					<UserStats />
					<UpcomingEvents />
					<QuickActions />
				</div>
			</div>
		</div>
	);
}
