"use client";

import { useRef } from "react";
import { AnimatedBeam, Circle } from "./AnimatedBeams";
import { User } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@heroui/react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

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

interface AnimatedEmailCardProps {
	email: ScheduledEmail;
	status: "pending" | "completed" | "canceled";
}

export function AnimatedEmailCard({ email, status }: AnimatedEmailCardProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const fromRef = useRef<HTMLDivElement>(null);
	const toRef = useRef<HTMLDivElement>(null);
	const user = useQuery(api.users.getUser);
	const cancelEmail = useMutation(api.scheduledEmails.cancelScheduledEmail);

	const getBeamColor = () => {
		switch (status) {
			case "pending":
				return "#f97316"; // Orange
			case "completed":
				return "#22c55e"; // Green
			case "canceled":
				return "#ef4444"; // Red
			default:
				return "#6b7280"; // Gray
		}
	};

	return (
		<div
			ref={containerRef}
			className="relative w-full h-32 bg-background rounded-lg border p-4"
		>
			{/* From (User) Avatar */}
			<div className="absolute left-4 top-1/2 -translate-y-1/2">
				<Circle ref={fromRef} className="border-primary">
					<User
						name={user?.name || ""}
						avatarProps={{
							src: user?.image,
							showFallback: true,
							size: "sm",
						}}
					/>
				</Circle>
			</div>

			{/* To (Recipient) Avatar */}
			<div className="absolute right-4 top-1/2 -translate-y-1/2">
				<Circle ref={toRef} className="border-primary">
					<User
						name={email.recipient.name}
						description={email.recipient.email}
						avatarProps={{
							showFallback: true,
							size: "sm",
						}}
					/>
				</Circle>
			</div>

			{/* Animated Beam */}
			<AnimatedBeam
				containerRef={containerRef}
				fromRef={fromRef}
				toRef={toRef}
				pathColor={getBeamColor()}
				pathWidth={2}
				pathOpacity={0.5}
				gradientStartColor={getBeamColor()}
				gradientStopColor={getBeamColor()}
				curvature={50}
			/>

			{/* Email Metadata (Above Beam) */}
			<div className="absolute left-1/2 -translate-x-1/2 top-2 text-center">
				<h3 className="text-sm font-medium">
					{email.subject || "Birthday Greeting"}
				</h3>
				<p className="text-xs text-muted-foreground">
					Scheduled for:{" "}
					{formatDistanceToNow(email.scheduledTime, { addSuffix: true })}
				</p>
			</div>

			{/* Additional Metadata (Below Beam) */}
			<div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-center">
				<p className="text-xs text-muted-foreground">
					{email.isAutomated
						? "Automated Birthday Email"
						: "Custom Scheduled Email"}
				</p>
				{email.completedTime && (
					<p className="text-xs text-muted-foreground">
						Completed:{" "}
						{formatDistanceToNow(email.completedTime, { addSuffix: true })}
					</p>
				)}
			</div>

			{/* Cancel Button (for pending emails) */}
			{status === "pending" && (
				<Button
					isIconOnly
					color="danger"
					variant="ghost"
					size="sm"
					className="absolute top-2 right-2"
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
		</div>
	);
}
