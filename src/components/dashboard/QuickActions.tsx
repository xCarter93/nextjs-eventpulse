"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { PremiumModal } from "../premium/PremiumModal";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { Accordion, AccordionItem } from "@heroui/react";
import {
	Users,
	Upload,
	Settings,
	Star,
	LucideIcon,
	Plus,
	Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getGoogleCalendarEvents } from "@/app/actions/googleCalendar";
import Image from "next/image";
import { ComponentType } from "react";
import { RecipientForm } from "../recipients/RecipientForm";
import { CustomAnimationUploader } from "../animations/CustomAnimationUploader";

interface QuickAction {
	name: string;
	icon: LucideIcon | ComponentType;
	color: string;
	isButton: boolean;
	href?: string;
	onClick?: () => void;
	disabled?: boolean;
	loading?: boolean;
	lastSync?: string;
	isImage?: boolean;
}

interface QuickActionsProps {
	selectedKeys?: string[];
	onSelectionChange?: (keys: string[]) => void;
}

export function QuickActions({
	selectedKeys = [],
	onSelectionChange,
}: QuickActionsProps = {}) {
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const user = useQuery(api.users.getUser);
	const [showPremiumModal, setShowPremiumModal] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [showRecipientModal, setShowRecipientModal] = useState(false);
	const [showAnimationModal, setShowAnimationModal] = useState(false);
	const syncGoogleCalendar = useMutation(api.events.syncGoogleCalendarEvents);

	const handleSyncCalendar = async () => {
		try {
			setIsSyncing(true);
			const events = await getGoogleCalendarEvents();
			await syncGoogleCalendar({ events });
			toast.success("Calendar synced successfully");
		} catch (error) {
			console.error("Calendar sync error:", error);
			toast.error("Failed to sync calendar");
		} finally {
			setIsSyncing(false);
		}
	};

	const lastSyncText = user?.lastGoogleCalendarSync
		? `Last synced ${formatDistanceToNow(new Date(user.lastGoogleCalendarSync))} ago`
		: "Not synced yet";

	const GoogleCalendarIcon = () => (
		<Image
			src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
			alt="Google Calendar"
			width={16}
			height={16}
			className={isSyncing ? "animate-spin" : ""}
		/>
	);

	const actions: QuickAction[] = [
		{
			name: "Sync Calendar",
			icon: GoogleCalendarIcon,
			color: "bg-white dark:bg-gray-900",
			isButton: true,
			onClick: handleSyncCalendar,
			loading: isSyncing,
			lastSync: lastSyncText,
			isImage: true,
		},
		{
			name: "Add Recipient",
			icon: Users,
			color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20",
			isButton: true,
			onClick: () => setShowRecipientModal(true),
		},
		{
			name: "Upload Animation",
			icon: Upload,
			color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20",
			isButton: true,
			onClick: () => setShowAnimationModal(true),
		},
		{
			name: "New Email",
			icon: Plus,
			href: "/scheduled-emails/new",
			color: "bg-green-100 text-green-600 dark:bg-green-900/20",
			isButton: false,
		},
		{
			name: "Settings",
			icon: Settings,
			href: "/settings",
			color: "bg-gray-100 text-gray-600 dark:bg-gray-800",
			isButton: false,
		},
		{
			name: "Upgrade Plan",
			icon: Star,
			color: "bg-amber-100 text-amber-600 dark:bg-amber-900/20",
			isButton: true,
			onClick: () => subscriptionLevel === "free" && setShowPremiumModal(true),
			disabled: subscriptionLevel !== "free",
		},
	];

	const handleSelectionChange = (keys: "all" | Set<React.Key>) => {
		if (onSelectionChange) {
			if (keys === "all") {
				onSelectionChange(["quick-actions"]);
			} else {
				onSelectionChange(Array.from(keys).map(String));
			}
		}
	};

	return (
		<>
			<div className="w-full quick-actions">
				<Accordion
					variant="shadow"
					selectionMode="multiple"
					className="w-full"
					selectedKeys={selectedKeys}
					onSelectionChange={handleSelectionChange}
				>
					<AccordionItem
						key="quick-actions"
						aria-label="Quick Actions"
						title={
							<div className="flex items-center gap-2">
								<Zap className="h-4 w-4 text-primary" />
								<span className="text-sm font-medium">Quick Actions</span>
							</div>
						}
						classNames={{
							trigger:
								"px-4 py-3 data-[hover=true]:bg-gray-50 dark:data-[hover=true]:bg-gray-800/50",
						}}
					>
						<div className="px-4 pb-4">
							<div className="grid grid-cols-2 gap-3">
								{actions.map((action) =>
									action.isButton ? (
										<button
											key={action.name}
											onClick={action.onClick}
											disabled={action.disabled || action.loading}
											className={`flex flex-col items-center p-3 rounded-lg transition-all ${
												action.disabled
													? "opacity-50 cursor-not-allowed"
													: "hover:scale-[1.02] hover:shadow-sm cursor-pointer"
											}`}
										>
											<div className={`p-2 rounded-full ${action.color} mb-2`}>
												{action.isImage ? (
													<action.icon />
												) : (
													<action.icon
														className={`h-4 w-4 ${action.loading ? "animate-spin" : ""}`}
													/>
												)}
											</div>
											<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
												{action.name}
											</span>
											{action.lastSync && (
												<span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
													{action.lastSync}
												</span>
											)}
										</button>
									) : (
										<Link
											key={action.name}
											href={action.href || "/"}
											className="flex flex-col items-center p-3 rounded-lg transition-all hover:scale-[1.02] hover:shadow-sm cursor-pointer"
										>
											<div className={`p-2 rounded-full ${action.color} mb-2`}>
												<action.icon className="h-4 w-4" />
											</div>
											<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
												{action.name}
											</span>
										</Link>
									)
								)}
							</div>
						</div>
					</AccordionItem>
				</Accordion>
			</div>

			{/* Premium Modal */}
			<PremiumModal
				isOpen={showPremiumModal}
				onClose={() => setShowPremiumModal(false)}
			/>

			{/* Add Recipient Modal */}
			<Modal
				isOpen={showRecipientModal}
				onOpenChange={setShowRecipientModal}
				placement="top-center"
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>
								<h2 className="text-lg font-semibold">Add Recipient</h2>
							</ModalHeader>
							<ModalBody>
								<RecipientForm onSuccess={onClose} />
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Upload Animation Modal */}
			<Modal
				isOpen={showAnimationModal}
				onOpenChange={setShowAnimationModal}
				placement="top-center"
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>
								<h2 className="text-lg font-semibold">Upload Animation</h2>
							</ModalHeader>
							<ModalBody>
								<CustomAnimationUploader onSuccess={onClose} />
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
