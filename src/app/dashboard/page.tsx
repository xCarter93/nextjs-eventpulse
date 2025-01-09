import { Calendar } from "@/components/dashboard/Calendar";
import { UpcomingBirthdays } from "@/components/dashboard/UpcomingBirthdays";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UserStats } from "@/components/dashboard/UserStats";
import { getPublicHolidays } from "@/app/actions/holidays";

export default async function DashboardPage() {
	const currentYear = new Date().getFullYear();
	const holidays = await getPublicHolidays(currentYear, "US");

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
				<UserStats />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<Calendar holidays={holidays} />
				</div>

				<div className="space-y-6">
					<UpcomingBirthdays />
					<QuickActions />
				</div>
			</div>
		</div>
	);
}
