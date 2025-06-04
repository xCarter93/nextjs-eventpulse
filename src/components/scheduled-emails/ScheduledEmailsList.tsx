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
	Sparkles,
} from "lucide-react";
import { AnimatedEmailCard } from "./AnimatedEmailCard";
import { Card, CardBody, Chip, Divider } from "@heroui/react";

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
				"Ready to schedule your first email? Create one now and watch the magic happen.",
			gradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
			chipColor: "primary" as const,
			chipText: "Ready to schedule",
		},
		completed: {
			icons: [Send, CheckCircle, Sparkles],
			title: "No completed emails",
			description:
				"Your sent emails will appear here once they've been delivered. Each successful send is a step closer to your goals.",
			gradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20",
			chipColor: "success" as const,
			chipText: "All clear",
		},
		canceled: {
			icons: [Ban, XCircle],
			title: "No canceled emails",
			description:
				"Canceled or failed emails will appear here. Sometimes a pause is just what you need.",
			gradient: "from-orange-500/20 via-red-500/20 to-pink-500/20",
			chipColor: "warning" as const,
			chipText: "Clean slate",
		},
	};

	const { icons, title, description, gradient, chipColor, chipText } =
		config[status];

	return (
		<div className="relative overflow-hidden">
			{/* Background gradient overlay */}
			<div
				className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 blur-3xl`}
			/>

			<Card
				radius="lg"
				shadow="lg"
				isBlurred={true}
				className="relative border border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150 hover:shadow-2xl hover:border-border/70 transition-all duration-500 ease-out hover:scale-[1.01]"
			>
				<CardBody className="p-8">
					<div className="min-h-[420px] flex items-center justify-center">
						<div className="text-center space-y-8 max-w-lg mx-auto">
							{/* Status chip */}
							<div className="flex justify-center">
								<Chip
									color={chipColor}
									variant="flat"
									size="sm"
									className="text-xs font-medium"
								>
									{chipText}
								</Chip>
							</div>

							{/* Animated icons grid */}
							<div className="relative">
								<div className="grid grid-cols-3 gap-6 mb-6">
									{icons.map((Icon, i) => (
										<div
											key={i}
											className="group cursor-default"
											style={{
												animation: `float 3s ease-in-out infinite ${i * 0.5}s`,
											}}
										>
											<div className="p-6 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl group-hover:from-primary/20 group-hover:to-primary/10 hover:shadow-xl hover:-translate-y-2 hover:rotate-3 transition-all duration-500 ease-out border border-border/30 group-hover:border-primary/40">
												<Icon
													className="w-10 h-10 text-muted-foreground group-hover:text-primary group-hover:scale-125 transition-all duration-500 ease-out"
													strokeWidth={1.5}
												/>
											</div>
										</div>
									))}
								</div>

								{/* Subtle radial gradient overlay */}
								<div className="absolute inset-0 bg-gradient-radial from-transparent via-background/20 to-background/60 pointer-events-none" />
							</div>

							<Divider className="opacity-30" />

							{/* Content */}
							<div className="space-y-4">
								<h3 className="text-2xl font-bold text-foreground tracking-tight">
									{title}
								</h3>
								<p className="text-muted-foreground leading-relaxed text-base max-w-md mx-auto">
									{description}
								</p>
							</div>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Add floating animation keyframes */}
			<style jsx>{`
				@keyframes float {
					0%,
					100% {
						transform: translateY(0px);
					}
					50% {
						transform: translateY(-10px);
					}
				}
			`}</style>
		</div>
	);
}

export function ScheduledEmailsList({
	filterStatus,
}: ScheduledEmailsListProps) {
	const scheduledEmails = useQuery(api.scheduledEmails.listScheduledEmails);

	if (!scheduledEmails) {
		return (
			<div className="flex items-center justify-center p-12">
				<div className="text-center space-y-4">
					<div className="relative">
						<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
						<div className="absolute inset-0 h-12 w-12 rounded-full bg-primary/20 animate-pulse mx-auto" />
					</div>
					<p className="text-sm text-muted-foreground font-medium">
						Loading your emails...
					</p>
				</div>
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
		<div className="space-y-6">
			{/* Results header */}
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold text-foreground">
						{filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}{" "}
						Emails
					</h2>
					<p className="text-sm text-muted-foreground">
						{filteredEmails.length}{" "}
						{filteredEmails.length === 1 ? "email" : "emails"} found
					</p>
				</div>
				<Chip
					color={
						filterStatus === "pending"
							? "primary"
							: filterStatus === "completed"
								? "success"
								: "warning"
					}
					variant="flat"
					size="sm"
				>
					{filteredEmails.length}
				</Chip>
			</div>

			{/* Emails grid with staggered animation */}
			<div className="grid gap-6">
				{filteredEmails.map((email, index) => (
					<div
						key={email._id}
						className="animate-in slide-in-from-bottom duration-500 ease-out"
						style={{
							animationDelay: `${index * 100}ms`,
							animationFillMode: "both",
						}}
					>
						<AnimatedEmailCard email={email} status={filterStatus} />
					</div>
				))}
			</div>
		</div>
	);
}
