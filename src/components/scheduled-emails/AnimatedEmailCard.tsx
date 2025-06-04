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
	Chip,
} from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import {
	Trash2,
	CheckCircle2,
	XCircle,
	Mail,
	UserRound,
	Zap,
	Clock,
} from "lucide-react";
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

	const getGradientClasses = () => {
		switch (status) {
			case "pending":
				return "from-orange-500/10 via-yellow-500/10 to-amber-500/10";
			case "completed":
				return "from-green-500/10 via-emerald-500/10 to-teal-500/10";
			case "canceled":
				return "from-red-500/10 via-pink-500/10 to-rose-500/10";
			default:
				return "from-gray-500/10 via-slate-500/10 to-zinc-500/10";
		}
	};

	const renderUserAvatar = () => (
		<div className="relative group">
			<Avatar
				name={user?.name || ""}
				src={user?.image}
				radius="full"
				showFallback
				isBordered
				color={getAvatarColor()}
				className="w-14 h-14 ring-2 ring-background/50 group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-110"
				fallback={
					<UserRound
						className="animate-pulse w-7 h-7 text-default-500"
						size={28}
					/>
				}
				classNames={{
					base: "w-14 h-14 shadow-lg",
					img: "object-cover opacity-100",
					fallback: "w-14 h-14",
				}}
			/>
			{/* Floating animation ring */}
			<div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
		</div>
	);

	return (
		<div className="relative group">
			{/* Background gradient overlay */}
			<div
				className={`absolute inset-0 bg-gradient-to-br ${getGradientClasses()} opacity-30 blur-2xl rounded-2xl`}
			/>

			<Card
				className="relative w-full backdrop-blur-xl bg-background/80 border border-border/50 hover:border-border/70 hover:shadow-2xl hover:bg-background/90 transition-all duration-500 ease-out hover:scale-[1.02] group-hover:-translate-y-1"
				radius="lg"
				shadow="lg"
				isBlurred
			>
				<CardBody className="relative p-6">
					{/* Status chip and type indicator */}
					<div className="flex items-center justify-between mb-4">
						<Chip
							color={
								status === "pending"
									? "warning"
									: status === "completed"
										? "success"
										: "danger"
							}
							variant="flat"
							size="sm"
							startContent={
								status === "pending" ? (
									<Clock size={12} />
								) : status === "completed" ? (
									<CheckCircle2 size={12} />
								) : (
									<XCircle size={12} />
								)
							}
							className="text-xs font-medium"
						>
							{status === "pending"
								? "Scheduled"
								: status === "completed"
									? "Delivered"
									: "Canceled"}
						</Chip>

						<Chip
							color="primary"
							variant="dot"
							size="sm"
							startContent={
								email.isAutomated ? <Zap size={12} /> : <Mail size={12} />
							}
							className="text-xs"
						>
							{email.isAutomated ? "Auto" : "Custom"}
						</Chip>
					</div>

					{/* Email subject with enhanced typography */}
					<div className="text-center mb-6 space-y-2">
						<h3 className="text-lg font-semibold text-foreground leading-tight tracking-tight line-clamp-2">
							{email.subject}
						</h3>
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground font-medium">
								Scheduled for{" "}
								{formatDistanceToNow(email.scheduledTime, { addSuffix: true })}
							</p>
							{email.completedTime && (
								<p className="text-xs text-muted-foreground">
									Delivered{" "}
									{formatDistanceToNow(email.completedTime, {
										addSuffix: true,
									})}
								</p>
							)}
						</div>
					</div>

					{/* Enhanced Animation Container */}
					<div
						ref={containerRef}
						className="relative w-[80%] mx-auto h-20 my-6"
					>
						<div className="flex h-full w-full items-center justify-between">
							{/* Enhanced From (User) Avatar */}
							<div ref={fromRef} className="relative z-10">
								<Tooltip
									content={
										<div className="p-2">
											<p className="font-medium">{user?.name}</p>
											<p className="text-xs text-muted-foreground">
												{user?.email}
											</p>
										</div>
									}
									delay={0}
									closeDelay={0}
									placement="top"
								>
									{status === "pending" ? (
										<Badge
											isOneChar
											color="warning"
											content={<Mail size={14} className="animate-bounce" />}
											placement="top-right"
											className="[&>span]:bg-orange-500 [&>span]:shadow-lg"
										>
											{renderUserAvatar()}
										</Badge>
									) : (
										renderUserAvatar()
									)}
								</Tooltip>
							</div>

							{/* Enhanced To (Recipients) Avatar Group */}
							<div ref={toRef} className="z-10">
								<AvatarGroup
									max={3}
									size="lg"
									radius="full"
									color={getAvatarColor()}
									isBordered
									className="gap-2"
								>
									{email.recipients.map((recipient, index) => (
										<Tooltip
											key={recipient.email}
											content={
												<div className="p-2">
													<p className="font-medium">{recipient.name}</p>
													<p className="text-xs text-muted-foreground">
														{recipient.email}
													</p>
												</div>
											}
											delay={0}
											closeDelay={0}
											placement="top"
										>
											<Avatar
												name={recipient.name}
												radius="full"
												showFallback
												isBordered
												color={getAvatarColor()}
												className="w-14 h-14 ring-2 ring-background/50 hover:ring-primary/30 transition-all duration-300 hover:scale-110 shadow-lg"
												style={{
													animationDelay: `${index * 0.1}s`,
												}}
												fallback={
													<UserRound
														className="animate-pulse w-7 h-7 text-default-500"
														size={28}
													/>
												}
												classNames={{
													base: "w-14 h-14 shadow-lg",
													img: "object-cover opacity-100",
													fallback: "w-14 h-14",
												}}
											/>
										</Tooltip>
									))}
								</AvatarGroup>
							</div>
						</div>

						{/* Enhanced Animated Beam */}
						<AnimatedBeam
							containerRef={containerRef}
							fromRef={fromRef}
							toRef={toRef}
							pathColor={status === "pending" ? "#6b7280" : getBeamColor()}
							pathWidth={3}
							pathOpacity={0.6}
							gradientStartColor={
								status === "pending" ? getBeamColor() : undefined
							}
							gradientStopColor={
								status === "pending" ? getBeamColor() : undefined
							}
							dotted={status === "pending"}
							dotSpacing={6}
						/>

						{/* Enhanced Status Icons for completed/canceled */}
						{status !== "pending" && (
							<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
								<div className="relative">
									<div className="absolute inset-0 rounded-full bg-background blur-sm" />
									{status === "completed" ? (
										<CheckCircle2 className="relative w-8 h-8 text-green-500 drop-shadow-lg animate-pulse" />
									) : (
										<XCircle className="relative w-8 h-8 text-red-500 drop-shadow-lg animate-pulse" />
									)}
								</div>
							</div>
						)}
					</div>

					{/* Enhanced Recipients count */}
					<div className="text-center mt-4">
						<p className="text-sm text-muted-foreground font-medium">
							{email.recipients.length}{" "}
							{email.recipients.length === 1 ? "recipient" : "recipients"}
						</p>
					</div>

					{/* Enhanced Cancel Button (for pending emails) */}
					{status === "pending" && (
						<Button
							isIconOnly
							color="danger"
							variant="flat"
							size="sm"
							className="absolute top-4 right-4 backdrop-blur-md bg-danger-50/80 hover:bg-danger-100 border border-danger-200/50 hover:border-danger-300 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
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

					{/* Error message for failed emails */}
					{email.error && status === "canceled" && (
						<div className="mt-4 p-3 bg-danger-50/50 border border-danger-200/50 rounded-lg">
							<p className="text-xs text-danger-600 font-medium">
								Error: {email.error}
							</p>
						</div>
					)}
				</CardBody>
			</Card>
		</div>
	);
}
