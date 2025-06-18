"use client";

import { Calendar } from "@/components/dashboard/Calendar";
import { useEffect, useState } from "react";
import { useTour } from "@/components/providers/tour-provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageWithStats } from "@/components/shared/PageWithStats";
import { Card, CardBody, Tabs, Tab } from "@heroui/react";
import { LayoutGrid, CalendarDays } from "lucide-react";

// Import dashboard widgets
import {
	StatsOverviewWidget,
	UpcomingEventsWidget,
	ScheduledEmailsWidget,
	PerformanceMetricsWidget,
	RecentActivityWidget,
} from "@/components/dashboard/widgets";

type DashboardView = "overview" | "calendar";

export default function DashboardPage() {
	const { startTour } = useTour();
	const user = useQuery(api.users.getUser);
	const updateHasSeenTour = useMutation(api.users.updateHasSeenTour);
	const [selectedView, setSelectedView] = useState<DashboardView>("overview");

	useEffect(() => {
		if (user && !user.hasSeenTour) {
			// Add a small delay to ensure components are mounted
			const timer = setTimeout(() => {
				startTour();
				// Update hasSeenTour to true
				updateHasSeenTour({
					hasSeenTour: true,
				});
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [user, startTour, updateHasSeenTour]);

	const OverviewDashboard = () => (
		<div className="space-y-6">
			{/* Stats Overview Cards */}
			<StatsOverviewWidget />

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{/* Row 1 */}
				<UpcomingEventsWidget />
				<ScheduledEmailsWidget />
				<PerformanceMetricsWidget />

				{/* Row 2 */}
				<RecentActivityWidget />

				{/* Calendar Preview Card - Only visible on larger screens */}
				<div className="hidden xl:block">
					<Card className="h-[300px]">
						<CardBody className="p-0">
							<div className="p-4 border-b">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-semibold">Calendar Preview</h3>
									<button
										onClick={() => setSelectedView("calendar")}
										className="text-sm text-primary hover:text-primary/80"
									>
										View Full Calendar
									</button>
								</div>
							</div>
							<div className="p-4">
								<div className="text-center text-gray-500 py-8">
									<CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-400" />
									<p className="text-sm">
										Switch to calendar view to see your full calendar
									</p>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);

	return (
		<PageWithStats>
			<div className="w-full h-full">
				{/* Welcome Section and View Selector */}
				<div className="mb-6">
					<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-4">
						<div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								Welcome back, {user?.name?.split(" ")[0] || "User"}! 👋
							</h1>
							<p className="text-gray-600 dark:text-gray-400">
								Here&apos;s what&apos;s happening with your contacts and events.
							</p>
						</div>
						<div className="flex-shrink-0">
							<Tabs
								selectedKey={selectedView}
								onSelectionChange={(key) =>
									setSelectedView(key as DashboardView)
								}
								variant="underlined"
								classNames={{
									tabList: "gap-6 relative rounded-none p-0",
									cursor: "w-full bg-primary",
									tab: "max-w-fit px-0 h-12",
									tabContent: "group-data-[selected=true]:text-primary",
								}}
							>
								<Tab
									key="overview"
									title={
										<div className="flex items-center gap-2">
											<LayoutGrid className="h-4 w-4" />
											<span>Overview</span>
										</div>
									}
								/>
								<Tab
									key="calendar"
									title={
										<div className="flex items-center gap-2">
											<CalendarDays className="h-4 w-4" />
											<span>Calendar</span>
										</div>
									}
								/>
							</Tabs>
						</div>
					</div>
				</div>

				{/* Dashboard Content */}
				<div className="pb-6">
					{selectedView === "overview" ? (
						<OverviewDashboard />
					) : (
						<div>
							<Calendar />
						</div>
					)}
				</div>
			</div>
		</PageWithStats>
	);
}
