"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Mail, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

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
				<CardHeader>
					<CardTitle>No {filterStatus} Emails</CardTitle>
					<CardDescription>
						{filterStatus === "pending"
							? "You don't have any pending emails scheduled at the moment."
							: filterStatus === "completed"
								? "No emails have been completed yet."
								: "No emails have been canceled or failed."}
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className="grid gap-4">
			{filteredEmails.map((email) => (
				<Card key={email._id}>
					<CardHeader className="pb-4">
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Mail className="h-5 w-5" />
									{email.subject || "Birthday Greeting"}
								</CardTitle>
								<CardDescription className="mt-1">
									To: {email.recipient.name} ({email.recipient.email})
								</CardDescription>
							</div>
							{email.status === "pending" && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										toast.promise(
											cancelEmail({ scheduledEmailId: email._id }),
											{
												loading: "Canceling email...",
												success: "Email canceled successfully",
												error: "Failed to cancel email",
											}
										);
									}}
								>
									<Trash2 className="h-4 w-4" />
									<span className="sr-only">Cancel email</span>
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-2 text-sm">
							<div>
								<span className="text-muted-foreground">Scheduled for: </span>
								{new Date(email.scheduledTime).toLocaleString()} (
								{formatDistanceToNow(email.scheduledTime, { addSuffix: true })})
							</div>
							{email.completedTime && (
								<div>
									<span className="text-muted-foreground">Completed: </span>
									{new Date(email.completedTime).toLocaleString()}
								</div>
							)}
							{email.customMessage && (
								<div>
									<span className="text-muted-foreground">Message: </span>
									{email.customMessage}
								</div>
							)}
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">Status: </span>
								<span
									className={cn(
										"inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
										{
											"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200":
												email.status === "pending",
											"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200":
												email.status === "inProgress",
											"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
												email.status === "success",
											"bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200":
												email.status === "failed",
											"bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200":
												email.status === "canceled",
										}
									)}
								>
									{email.status.charAt(0).toUpperCase() + email.status.slice(1)}
								</span>
							</div>
							{email.error && (
								<div className="text-red-600 dark:text-red-400">
									<span className="font-medium">Error: </span>
									{email.error}
								</div>
							)}
							<div>
								<span className="text-muted-foreground">Type: </span>
								{email.isAutomated
									? "Automated Birthday Email"
									: "Custom Scheduled Email"}
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
