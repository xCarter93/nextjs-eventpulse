"use client";

import { Calendar } from "@/components/dashboard/Calendar";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UserStats } from "@/components/dashboard/UserStats";
import { useEffect } from "react";
import { useTour } from "@/components/providers/tour-provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DashboardPage() {
	const { startTour } = useTour();
	const user = useQuery(api.users.getUser);
	const updateHasSeenTour = useMutation(api.users.updateHasSeenTour);

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

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
