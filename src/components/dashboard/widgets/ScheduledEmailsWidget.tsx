"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardBody, Chip } from "@heroui/react";
import { Mail, Clock, Users, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function ScheduledEmailsWidget() {
	const scheduledEmails = useQuery(api.scheduledEmails.listScheduledEmails);

	if (!scheduledEmails) {
		return (
			<Card className="h-[300px]">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Mail className="h-5 w-5 text-primary" />
						<h3 className="text-lg font-semibold">Scheduled Emails</h3>
					</div>
				</CardHeader>
				<CardBody className="animate-pulse">
					<div className="space-y-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex items-center gap-3">
								<div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
								<div className="flex-1">
									<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
									<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
								</div>
							</div>
						))}
					</div>
				</CardBody>
			</Card>
		);
	}

	const pendingEmails = scheduledEmails
		.filter((email) => email.status === "pending")
		.sort((a, b) => a.scheduledTime - b.scheduledTime)
		.slice(0, 5); // Show only top 5 pending emails

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "warning";
			case "sent":
				return "success";
			case "failed":
				return "danger";
			default:
				return "default";
		}
	};

	const isOverdue = (scheduledTime: number) => {
		return scheduledTime < Date.now();
	};

	return (
		<Card className="h-[300px]">
			<CardHeader className="flex flex-row items-center justify-between pb-3">
				<div className="flex items-center gap-2">
					<Mail className="h-5 w-5 text-primary" />
					<h3 className="text-lg font-semibold">Scheduled Emails</h3>
				</div>
				<Link
					href="/scheduled-emails"
					className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
				>
					View All
					<ArrowRight className="h-3 w-3" />
				</Link>
			</CardHeader>
			<CardBody className="pt-0">
				{pendingEmails.length > 0 ? (
					<div className="space-y-3">
						{pendingEmails.map((email) => {
							const scheduledDate = new Date(email.scheduledTime);
							const overdue = isOverdue(email.scheduledTime);

							return (
								<div
									key={email._id}
									className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
								>
									<div
										className={`p-2 rounded-full ${
											overdue
												? "bg-red-100 text-red-600 dark:bg-red-900/20"
												: "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
										}`}
									>
										<Mail className="h-4 w-4" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium truncate mb-1">
											{email.subject ||
												(email.isAutomated
													? "Automated Email"
													: "Custom Email")}
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
											<Users className="h-3 w-3" />
											<span>
												{email.recipients.length} recipient
												{email.recipients.length !== 1 ? "s" : ""}
											</span>
										</div>
										<div className="flex items-center gap-1 text-xs text-gray-500">
											<Clock className="h-3 w-3" />
											<span>
												{overdue
													? `Overdue by ${formatDistanceToNow(scheduledDate)}`
													: formatDistanceToNow(scheduledDate, {
															addSuffix: true,
														})}
											</span>
										</div>
									</div>
									<div className="flex flex-col items-end gap-1">
										<Chip
											size="sm"
											color={overdue ? "danger" : getStatusColor(email.status)}
											variant="flat"
										>
											{overdue ? "Overdue" : email.status}
										</Chip>
										<div className="text-xs text-gray-500">
											{format(scheduledDate, "MMM d, HH:mm")}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<Mail className="h-12 w-12 text-gray-400 mb-3" />
						<div className="text-sm text-gray-500 mb-1">
							No scheduled emails
						</div>
						<div className="text-xs text-gray-400">
							Create your first email campaign
						</div>
						<Link
							href="/scheduled-emails/new"
							className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs hover:bg-primary/90 transition-colors"
						>
							Schedule Email
						</Link>
					</div>
				)}
			</CardBody>
		</Card>
	);
}
