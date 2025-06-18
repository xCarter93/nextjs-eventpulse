"use client";

import { Card, CardHeader, CardBody } from "@heroui/react";
import { Activity, Mail, Users, Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
	id: string;
	type: "email_scheduled" | "contact_added" | "event_created" | "email_sent";
	message: string;
	timestamp: Date;
	icon: React.ComponentType<{ className?: string }>;
	color: string;
}

export function RecentActivityWidget() {
	// TODO: Replace with real activity data from backend
	const recentActivity: ActivityItem[] = [
		{
			id: "1",
			type: "email_scheduled",
			message: "Scheduled birthday reminder for Sarah Johnson",
			timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
			icon: Mail,
			color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20",
		},
		{
			id: "2",
			type: "contact_added",
			message: "Added new contact: Mike Davis",
			timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
			icon: Users,
			color: "bg-green-100 text-green-600 dark:bg-green-900/20",
		},
		{
			id: "3",
			type: "event_created",
			message: "Created custom event: Team Meeting",
			timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
			icon: Calendar,
			color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20",
		},
		{
			id: "4",
			type: "email_sent",
			message: "Sent holiday greeting to 12 recipients",
			timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
			icon: Mail,
			color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20",
		},
		{
			id: "5",
			type: "contact_added",
			message: "Added new contact: Emma Wilson",
			timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
			icon: Users,
			color: "bg-green-100 text-green-600 dark:bg-green-900/20",
		},
	];

	return (
		<Card className="h-[300px]">
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<Activity className="h-5 w-5 text-primary" />
					<h3 className="text-lg font-semibold">Recent Activity</h3>
					<span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
						Placeholder Data
					</span>
				</div>
			</CardHeader>
			<CardBody className="pt-0">
				<div className="space-y-3">
					{recentActivity.slice(0, 4).map((activity, index) => (
						<div
							key={activity.id}
							className="flex items-start gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors"
						>
							<div
								className={`p-2 rounded-full ${activity.color} flex-shrink-0`}
							>
								<activity.icon className="h-3 w-3" />
							</div>
							<div className="flex-1 min-w-0">
								<div className="text-sm text-gray-900 dark:text-gray-100 mb-1">
									{activity.message}
								</div>
								<div className="flex items-center gap-1 text-xs text-gray-500">
									<Clock className="h-3 w-3" />
									<span>
										{formatDistanceToNow(activity.timestamp, {
											addSuffix: true,
										})}
									</span>
								</div>
							</div>
							{index === 0 && (
								<div className="flex-shrink-0">
									<div className="w-2 h-2 bg-primary rounded-full"></div>
								</div>
							)}
						</div>
					))}

					{recentActivity.length === 0 && (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<Activity className="h-12 w-12 text-gray-400 mb-3" />
							<div className="text-sm text-gray-500 mb-1">
								No recent activity
							</div>
							<div className="text-xs text-gray-400">
								Your activity will appear here
							</div>
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);
}

/* TODO: Backend implementation needed for real activity tracking
 * 1. Add activity_log table to track user actions
 * 2. Create activity logging functions:
 *    - logEmailScheduled(emailId, userId)
 *    - logContactAdded(contactId, userId)
 *    - logEventCreated(eventId, userId)
 *    - logEmailSent(emailId, userId)
 * 3. Add activity queries in Convex:
 *    - getRecentActivity(userId, limit)
 *    - getActivityByType(userId, type)
 * 4. Integrate activity logging throughout the app
 * 5. Add activity filtering and pagination
 */
