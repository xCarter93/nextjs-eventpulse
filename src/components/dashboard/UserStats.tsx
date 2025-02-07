"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getSubscriptionLimits } from "@/lib/subscriptions";
import { Users, Film, Calendar, Bell } from "lucide-react";
import { Card, CardHeader, CardBody } from "@heroui/card";

export function UserStats() {
	const recipients = useQuery(api.recipients.getRecipients);
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const limits = getSubscriptionLimits(subscriptionLevel ?? "free");

	if (!recipients) return null;

	const features = [
		{
			name: "Recipients",
			value: `${recipients.length}/${limits.maxRecipients === Infinity ? "∞" : limits.maxRecipients}`,
			icon: Users,
		},
		{
			name: "Storage",
			value:
				limits.maxAnimationStorageDays === Infinity
					? "∞"
					: `${limits.maxAnimationStorageDays}d`,
			icon: Film,
		},
		{
			name: "Schedule",
			value:
				limits.maxScheduleDaysInAdvance === Infinity
					? "∞"
					: `${limits.maxScheduleDaysInAdvance}d`,
			icon: Calendar,
		},
		{
			name: "Events",
			value:
				limits.maxUpcomingEvents === Infinity ? "∞" : limits.maxUpcomingEvents,
			icon: Bell,
		},
	];

	return (
		<Card className="w-full user-stats" shadow="sm">
			<CardHeader className="flex justify-between items-center px-4 py-3">
				<div className="text-sm font-medium">Plan Status</div>
				<div
					className={`px-2 py-0.5 rounded-full text-xs font-medium ${
						subscriptionLevel === "pro"
							? "bg-primary text-white"
							: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
					}`}
				>
					{subscriptionLevel === "pro" ? "Pro" : "Free"}
				</div>
			</CardHeader>
			<CardBody className="px-4 py-3">
				<div className="grid grid-cols-2 gap-4">
					{features.map((feature) => (
						<div key={feature.name} className="flex items-center gap-2">
							<feature.icon className="h-4 w-4 text-gray-500" />
							<div className="min-w-0">
								<div className="text-xs text-gray-500">{feature.name}</div>
								<div className="text-sm font-semibold">{feature.value}</div>
							</div>
						</div>
					))}
				</div>
			</CardBody>
		</Card>
	);
}
