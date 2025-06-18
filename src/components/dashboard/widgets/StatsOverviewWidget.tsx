"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardBody, Progress } from "@heroui/react";
import { Users, Mail, Calendar, TrendingUp } from "lucide-react";
import { getSubscriptionLimits } from "@/lib/subscriptions";

export function StatsOverviewWidget() {
	const recipients = useQuery(api.recipients.getRecipients);
	const scheduledEmails = useQuery(api.scheduledEmails.listScheduledEmails);
	const customEvents = useQuery(api.events.getEvents);
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

	const limits = getSubscriptionLimits(subscriptionLevel ?? "free");

	if (!recipients || !scheduledEmails || !customEvents) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i} className="h-[120px]">
						<CardBody className="animate-pulse">
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
							<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
						</CardBody>
					</Card>
				))}
			</div>
		);
	}

	const pendingEmails = scheduledEmails.filter(
		(email) => email.status === "pending"
	).length;
	const totalContacts = recipients.length;
	const totalEvents = customEvents.length;

	// Calculate usage percentage for recipients
	const recipientUsagePercentage =
		limits.maxRecipients === Infinity
			? 0
			: (totalContacts / limits.maxRecipients) * 100;

	// TODO: Add backend logic to track email delivery rates
	const emailDeliveryRate = 94.5; // Placeholder data

	const stats = [
		{
			title: "Total Contacts",
			value: totalContacts,
			subtitle: `of ${limits.maxRecipients === Infinity ? "∞" : limits.maxRecipients} limit`,
			icon: Users,
			color: "primary" as const,
			progress: recipientUsagePercentage,
		},
		{
			title: "Pending Emails",
			value: pendingEmails,
			subtitle: "scheduled to send",
			icon: Mail,
			color: "success" as const,
		},
		{
			title: "Custom Events",
			value: totalEvents,
			subtitle: "created events",
			icon: Calendar,
			color: "secondary" as const,
		},
		{
			title: "Delivery Rate",
			value: `${emailDeliveryRate}%`,
			subtitle: "last 30 days",
			icon: TrendingUp,
			color: "warning" as const,
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{stats.map((stat, index) => (
				<Card
					key={index}
					className="hover:scale-[1.02] transition-transform duration-200"
					shadow="sm"
				>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<div className="flex items-center gap-2">
							<div
								className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}
							>
								<stat.icon className={`h-4 w-4 text-${stat.color}`} />
							</div>
						</div>
					</CardHeader>
					<CardBody className="pt-0">
						<div className="space-y-2">
							<div className="text-2xl font-bold">{stat.value}</div>
							<div className="text-sm text-muted-foreground">{stat.title}</div>
							<div className="text-xs text-muted-foreground">
								{stat.subtitle}
							</div>
							{stat.progress !== undefined && (
								<Progress
									value={stat.progress}
									size="sm"
									color={stat.color}
									className="mt-2"
								/>
							)}
						</div>
					</CardBody>
				</Card>
			))}
		</div>
	);
}
