"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
	Loader2,
	Clock,
	CheckCircle,
	XCircle,
	CalendarClock,
	Send,
	Ban,
} from "lucide-react";
import { AnimatedEmailCard } from "./AnimatedEmailCard";
import { Card, CardBody } from "@heroui/react";

interface ScheduledEmailsListProps {
	filterStatus: "pending" | "completed" | "canceled";
}

function EmptyState({
	status,
}: {
	status: "pending" | "completed" | "canceled";
}) {
	const config = {
		pending: {
			icons: [CalendarClock, Clock, Send],
			title: "No pending emails",
			description:
				"You don't have any scheduled emails waiting to be sent. Create a new scheduled email to get started.",
		},
		completed: {
			icons: [Send, CheckCircle],
			title: "No completed emails",
			description:
				"You haven't sent any scheduled emails yet. They will appear here after they've been sent.",
		},
		canceled: {
			icons: [Ban, XCircle],
			title: "No canceled emails",
			description:
				"You haven't canceled any scheduled emails. Canceled emails will appear here.",
		},
	};

	const { icons, title, description } = config[status];

	return (
		<Card
			radius="lg"
			shadow="md"
			isBlurred={true}
			className="border border-border/40 bg-background/60 backdrop-blur-lg backdrop-saturate-150 hover:shadow-lg transition-shadow duration-300"
		>
			<CardBody>
				<div className="min-h-[400px] flex items-center justify-center">
					<div className="text-center space-y-6 max-w-md mx-auto p-6">
						<div className="relative">
							<div className="grid grid-cols-3 gap-4 mb-4">
								{icons.map((Icon, i) => (
									<div
										key={i}
										className="p-4 bg-muted/30 rounded-xl group hover:bg-primary/10 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
									>
										<Icon
											className="w-8 h-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300"
											strokeWidth={1.5}
										/>
									</div>
								))}
							</div>
							<div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-foreground mb-2">
								{title}
							</h3>
							<p className="text-sm text-muted-foreground">{description}</p>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
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
		return <EmptyState status={filterStatus} />;
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
