"use client";

import { useRef } from "react";
import { AnimatedBeam, Circle } from "./AnimatedBeams";
import { Avatar, Badge } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import { Trash2, CheckCircle2, XCircle, Mail } from "lucide-react";
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
		<div className="relative w-full bg-background rounded-lg border p-4 md:shadow-xl">
			{/* Email Metadata (Top) */}
			<div className="text-center mb-3">
				<h3 className="text-sm font-medium">
					{email.subject || "Birthday Greeting"}
				</h3>
				<p className="text-xs text-muted-foreground">
					Scheduled for:{" "}
					{formatDistanceToNow(email.scheduledTime, { addSuffix: true })}
				</p>
			</div>

			{/* Animation Container */}
			<div ref={containerRef} className="relative w-[75%] mx-auto h-16 my-2">
				<div className="flex h-full w-full items-center justify-between">
					{/* From (User) Avatar */}
					<Circle ref={fromRef} className="border-primary relative">
						{status === "pending" ? (
							<Badge
								isOneChar
								color="warning"
								content={<Mail className="h-3 w-3" />}
								placement="bottom-right"
								className="[&>span]:bg-orange-500"
							>
								<Avatar
									name={user?.name || ""}
									src={user?.image}
									radius="full"
									showFallback
									classNames={{
										base: "w-full h-full",
										img: "w-full h-full object-cover",
										fallback: "w-full h-full",
									}}
								/>
							</Badge>
						) : (
							<Avatar
								name={user?.name || ""}
								src={user?.image}
								radius="full"
								showFallback
								classNames={{
									base: "w-full h-full",
									img: "w-full h-full object-cover",
									fallback: "w-full h-full",
								}}
							/>
						)}
					</Circle>

					{/* To (Recipient) Avatar */}
					<Circle ref={toRef} className="border-primary">
						<Avatar
							name={email.recipient.name}
							radius="full"
							showFallback
							classNames={{
								base: "w-full h-full",
								img: "w-full h-full object-cover",
								fallback: "w-full h-full",
							}}
						/>
					</Circle>
				</div>

				{/* Animated Beam */}
				<AnimatedBeam
					containerRef={containerRef}
					fromRef={fromRef}
					toRef={toRef}
					pathColor={status === "pending" ? "#6b7280" : getBeamColor()}
					pathWidth={2}
					pathOpacity={0.5}
					gradientStartColor={status === "pending" ? getBeamColor() : undefined}
					gradientStopColor={status === "pending" ? getBeamColor() : undefined}
					dotted={status === "pending"}
					dotSpacing={5}
				/>

				{/* Status Icons for completed/canceled */}
				{status !== "pending" && (
					<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
						{status === "completed" ? (
							<CheckCircle2 className="w-6 h-6 text-green-500" />
						) : (
							<XCircle className="w-6 h-6 text-red-500" />
						)}
					</div>
				)}
			</div>

			{/* Additional Metadata (Bottom) */}
			<div className="text-center mt-3">
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
					className="absolute top-4 right-4"
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
