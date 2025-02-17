"use client";

import { useRef } from "react";
import { AnimatedBeam } from "./AnimatedBeams";
import {
	Avatar,
	AvatarGroup,
	Badge,
	Card,
	CardBody,
	Tooltip,
} from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import { Trash2, CheckCircle2, XCircle, Mail, UserRound } from "lucide-react";
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
	recipients: Array<{
		name: string;
		email: string;
	}>;
	subject: string;
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

	const getAvatarColor = () => {
		switch (status) {
			case "pending":
				return "warning";
			case "completed":
				return "success";
			case "canceled":
				return "danger";
			default:
				return "default";
		}
	};

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

	const renderUserAvatar = () => (
		<Avatar
			name={user?.name || ""}
			src={user?.image}
			radius="full"
			showFallback
			isBordered
			color={getAvatarColor()}
			className="w-12 h-12"
			fallback={
				<UserRound
					className="animate-pulse w-6 h-6 text-default-500"
					size={24}
				/>
			}
			classNames={{
				base: "w-12 h-12",
				img: "object-cover opacity-100",
				fallback: "w-12 h-12",
			}}
		/>
	);

	return (
		<Card
			className="w-full hover:shadow-lg transition-shadow duration-200"
			radius="lg"
		>
			<CardBody className="relative p-4">
				{/* Email Metadata (Top) */}
				<div className="text-center mb-3">
					<h3 className="text-sm font-medium">{email.subject}</h3>
					<p className="text-xs text-muted-foreground">
						Scheduled for:{" "}
						{formatDistanceToNow(email.scheduledTime, { addSuffix: true })}
					</p>
				</div>

				{/* Animation Container */}
				<div ref={containerRef} className="relative w-[75%] mx-auto h-16 my-2">
					<div className="flex h-full w-full items-center justify-between">
						{/* From (User) Avatar */}
						<div
							ref={fromRef}
							className="relative z-10 rounded-full bg-background"
						>
							<Tooltip content={user?.email} delay={0} closeDelay={0}>
								{status === "pending" ? (
									<Badge
										isOneChar
										color="warning"
										content={<Mail size={12} />}
										placement="top-right"
										className="[&>span]:bg-orange-500"
									>
										{renderUserAvatar()}
									</Badge>
								) : (
									renderUserAvatar()
								)}
							</Tooltip>
						</div>

						{/* To (Recipients) Avatar Group */}
						<div ref={toRef} className="z-10 rounded-full bg-background">
							<AvatarGroup
								max={3}
								size="lg"
								radius="full"
								color={getAvatarColor()}
								isBordered
							>
								{email.recipients.map((recipient) => (
									<Tooltip
										key={recipient.email}
										content={recipient.email}
										delay={0}
										closeDelay={0}
									>
										<Avatar
											name={recipient.name}
											radius="full"
											showFallback
											isBordered
											color={getAvatarColor()}
											fallback={
												<UserRound
													className="animate-pulse w-6 h-6 text-default-500"
													size={24}
												/>
											}
											classNames={{
												base: "w-12 h-12",
												img: "object-cover opacity-100",
												fallback: "w-12 h-12",
											}}
										/>
									</Tooltip>
								))}
							</AvatarGroup>
						</div>
					</div>

					{/* Animated Beam */}
					<AnimatedBeam
						containerRef={containerRef}
						fromRef={fromRef}
						toRef={toRef}
						pathColor={status === "pending" ? "#6b7280" : getBeamColor()}
						pathWidth={2}
						pathOpacity={0.5}
						gradientStartColor={
							status === "pending" ? getBeamColor() : undefined
						}
						gradientStopColor={
							status === "pending" ? getBeamColor() : undefined
						}
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
			</CardBody>
		</Card>
	);
}
