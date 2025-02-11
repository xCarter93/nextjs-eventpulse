"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2 } from "lucide-react";
import { AnimatedEmailCard } from "./AnimatedEmailCard";

interface ScheduledEmailsListProps {
	filterStatus: "pending" | "completed" | "canceled";
}

export function ScheduledEmailsList({
	filterStatus,
}: ScheduledEmailsListProps) {
	const scheduledEmails = useQuery(api.scheduledEmails.listScheduledEmails);

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
			<div className="rounded-lg border bg-card p-8 text-center">
				<h3 className="text-base font-semibold leading-7 text-foreground">
					No {filterStatus} Emails
				</h3>
				<p className="mt-1 text-sm leading-6 text-muted-foreground">
					{filterStatus === "pending"
						? "You don't have any pending emails scheduled at the moment."
						: filterStatus === "completed"
							? "No emails have been completed yet."
							: "No emails have been canceled or failed."}
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4">
			{filteredEmails.map((email) => (
				<AnimatedEmailCard
					key={email._id}
					email={email}
					status={filterStatus}
				/>
			))}
		</div>
	);
}
