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
	Button,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	useDisclosure,
} from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import {
	Trash2,
	CheckCircle2,
	XCircle,
	Mail,
	UserRound,
	Clock,
	Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { type EmailComponent } from "../../types/email-components";
import { getCustomEmailHtml } from "../../email-templates/CustomEmailTemplate";

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
	// New fields for preview
	components?: EmailComponent[];
	colorScheme?: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
	};
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
	const { isOpen, onOpen, onOpenChange } = useDisclosure();

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

	// Generate preview HTML if components are available
	const getPreviewHtml = () => {
		if (email.components) {
			return getCustomEmailHtml({
				components: email.components,
				colorScheme: email.colorScheme,
			});
		}
		return null;
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
				className="w-12 h-12 ring-2 ring-background/50 group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-110"
				fallback={
					<UserRound
						className="animate-pulse w-6 h-6 text-default-500"
						size={24}
					/>
				}
				classNames={{
					base: "w-12 h-12 shadow-lg",
					img: "object-cover opacity-100",
					fallback: "w-12 h-12",
				}}
			/>
			{/* Floating animation ring */}
			<div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
		</div>
	);

	const previewHtml = getPreviewHtml();

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
				<CardBody className="relative p-4">
					{/* Status chip and action buttons */}
					<div className="flex items-center justify-between mb-3">
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

						{/* Action buttons container */}
						<div className="flex items-center gap-2">
							{/* Preview button */}
							{previewHtml && (
								<Button
									isIconOnly
									color="primary"
									variant="flat"
									size="sm"
									className="backdrop-blur-md bg-primary-50/80 hover:bg-primary-100 border border-primary-200/50 hover:border-primary-300 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
									onPress={onOpen}
								>
									<Eye className="h-4 w-4" />
									<span className="sr-only">Preview email</span>
								</Button>
							)}

							{/* Cancel button (for pending emails) */}
							{status === "pending" && (
								<Button
									isIconOnly
									color="danger"
									variant="flat"
									size="sm"
									className="backdrop-blur-md bg-danger-50/80 hover:bg-danger-100 border border-danger-200/50 hover:border-danger-300 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
									onPress={() => {
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
					</div>

					{/* Email subject with enhanced typography */}
					<div className="text-center mb-4 space-y-1">
						<h3 className="text-base font-semibold text-foreground leading-tight tracking-tight line-clamp-2">
							{email.subject}
						</h3>
						<div className="space-y-0.5">
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
						className="relative w-[80%] mx-auto h-16 my-4"
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
											content={<Mail size={12} className="animate-bounce" />}
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
									size="md"
									radius="full"
									color={getAvatarColor()}
									isBordered
									className="gap-1"
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
												className="w-12 h-12 ring-2 ring-background/50 hover:ring-primary/30 transition-all duration-300 hover:scale-110 shadow-lg"
												style={{
													animationDelay: `${index * 0.1}s`,
												}}
												fallback={
													<UserRound
														className="animate-pulse w-6 h-6 text-default-500"
														size={24}
													/>
												}
												classNames={{
													base: "w-12 h-12 shadow-lg",
													img: "object-cover opacity-100",
													fallback: "w-12 h-12",
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
										<CheckCircle2 className="relative w-6 h-6 text-green-500 drop-shadow-lg animate-pulse" />
									) : (
										<XCircle className="relative w-6 h-6 text-red-500 drop-shadow-lg animate-pulse" />
									)}
								</div>
							</div>
						)}
					</div>

					{/* Enhanced Recipients count */}
					<div className="text-center mt-3">
						<p className="text-sm text-muted-foreground font-medium">
							{email.recipients.length}{" "}
							{email.recipients.length === 1 ? "recipient" : "recipients"}
						</p>
					</div>

					{/* Error message for failed emails */}
					{email.error && status === "canceled" && (
						<div className="mt-3 p-2 bg-danger-50/50 border border-danger-200/50 rounded-lg">
							<p className="text-xs text-danger-600 font-medium">
								Error: {email.error}
							</p>
						</div>
					)}
				</CardBody>
			</Card>

			{/* Email Preview Modal */}
			<Modal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				size="4xl"
				scrollBehavior="inside"
				classNames={{
					base: "bg-background/95 backdrop-blur-xl",
					header: "border-b border-border/50",
					body: "py-6",
				}}
			>
				<ModalContent>
					{() => (
						<>
							<ModalHeader className="flex flex-col gap-1">
								<h2 className="text-lg font-semibold">Email Preview</h2>
								<p className="text-sm text-muted-foreground">{email.subject}</p>
							</ModalHeader>
							<ModalBody>
								{previewHtml ? (
									<div
										className="w-full h-[600px] border border-border/50 rounded-lg overflow-hidden"
										style={{
											background:
												"linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
										}}
									>
										<iframe
											srcDoc={previewHtml}
											className="w-full h-full"
											title="Email Preview"
											sandbox="allow-same-origin"
										/>
									</div>
								) : (
									<div className="flex items-center justify-center h-[400px] text-muted-foreground">
										<p>Preview not available for this email</p>
									</div>
								)}
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
