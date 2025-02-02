"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Mail, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardHeader, CardBody, Button, Chip } from "@heroui/react";

interface ScheduledEmail {
	_id: Id<"_scheduled_functions">;
	scheduledTime: number;
	completedTime?: number;
	status: "pending" | "inProgress" | "success" | "failed" | "canceled";
	recipient: {
		name: string;
		email: string;
	};
	customMessage?: string;
	subject?: string;
	isAutomated: boolean;
	error?: string;
}

interface ScheduledEmailsListProps {
	filterStatus: "pending" | "completed" | "canceled";
}

const statusColorMap = {
	pending: "warning",
	inProgress: "primary",
	success: "success",
	failed: "danger",
	canceled: "default",
} as const;

export function ScheduledEmailsList({
	filterStatus,
}: ScheduledEmailsListProps) {
	const scheduledEmails = useQuery(api.scheduledEmails.listScheduledEmails) as
		| ScheduledEmail[]
		| undefined;
	const cancelEmail = useMutation(api.scheduledEmails.cancelScheduledEmail);

	if (!scheduledEmails) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const filteredEmails = scheduledEmails.filter((email) => {
		if (filterStatus === "pending") {
			return email.status === "pending" || email.status === "inProgress";
		}
		if (filterStatus === "completed") {
			return email.status === "success";
		}
		return email.status === "canceled" || email.status === "failed";
	});

	if (filteredEmails.length === 0) {
		return (
			<Card>
				<CardBody className="px-4 py-6 sm:p-8">
					<h3 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
						No {filterStatus} Emails
					</h3>
					<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
						{filterStatus === "pending"
							? "You don't have any pending emails scheduled at the moment."
							: filterStatus === "completed"
								? "No emails have been completed yet."
								: "No emails have been canceled or failed."}
					</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className="grid gap-4">
			{filteredEmails.map((email) => (
				<Card key={email._id}>
					<CardHeader className="flex flex-row items-start justify-between gap-4">
						<div>
							<div className="flex items-center gap-2">
								<Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
								<h3 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
									{email.subject || "Birthday Greeting"}
								</h3>
							</div>
							<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
								To: {email.recipient.name} ({email.recipient.email})
							</p>
						</div>
						{email.status === "pending" && (
							<Button
								variant="ghost"
								isIconOnly
								color="danger"
								onPress={() => {
									toast.promise(cancelEmail({ scheduledEmailId: email._id }), {
										loading: "Canceling email...",
										success: "Email canceled successfully",
										error: "Failed to cancel email",
									});
								}}
							>
								<Trash2 className="h-4 w-4" />
								<span className="sr-only">Cancel email</span>
							</Button>
						)}
					</CardHeader>
					<CardBody className="pt-0">
						<div className="flex flex-col gap-4 text-sm">
							<div>
								<span className="text-gray-500 dark:text-gray-400">
									Scheduled for:{" "}
								</span>
								<span className="text-gray-700 dark:text-gray-300">
									{new Date(email.scheduledTime).toLocaleString()} (
									{formatDistanceToNow(email.scheduledTime, {
										addSuffix: true,
									})}
									)
								</span>
							</div>
							{email.completedTime && (
								<div>
									<span className="text-gray-500 dark:text-gray-400">
										Completed:{" "}
									</span>
									<span className="text-gray-700 dark:text-gray-300">
										{new Date(email.completedTime).toLocaleString()}
									</span>
								</div>
							)}
							{email.customMessage && (
								<div>
									<span className="text-gray-500 dark:text-gray-400">
										Message:{" "}
									</span>
									<span className="text-gray-700 dark:text-gray-300">
										{email.customMessage}
									</span>
								</div>
							)}
							<div className="flex items-center gap-2">
								<span className="text-gray-500 dark:text-gray-400">
									Status:{" "}
								</span>
								<Chip
									color={statusColorMap[email.status]}
									variant="flat"
									size="sm"
								>
									{email.status.charAt(0).toUpperCase() + email.status.slice(1)}
								</Chip>
							</div>
							{email.error && (
								<div className="text-red-600 dark:text-red-400">
									<span className="font-medium">Error: </span>
									{email.error}
								</div>
							)}
							<div>
								<span className="text-gray-500 dark:text-gray-400">Type: </span>
								<span className="text-gray-700 dark:text-gray-300">
									{email.isAutomated
										? "Automated Birthday Email"
										: "Custom Scheduled Email"}
								</span>
							</div>
						</div>
					</CardBody>
				</Card>
			))}
		</div>
	);
}
