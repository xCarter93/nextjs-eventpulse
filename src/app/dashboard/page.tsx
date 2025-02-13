"use client";

import { Calendar } from "@/components/dashboard/Calendar";
import { useEffect } from "react";
import { useTour } from "@/components/providers/tour-provider";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageWithStats } from "@/components/shared/PageWithStats";

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
		<PageWithStats>
			<Calendar />
		</PageWithStats>
	);
}
