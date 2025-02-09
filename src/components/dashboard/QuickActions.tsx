"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { PremiumModal } from "../premium/PremiumModal";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Users, Wand2, Settings, Star, LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getGoogleCalendarEvents } from "@/app/actions/googleCalendar";
import Image from "next/image";
import { ComponentType } from "react";

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

export function QuickActions() {
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const user = useQuery(api.users.getUser);
	const [showPremiumModal, setShowPremiumModal] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
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
			href: "/recipients",
			color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20",
			isButton: false,
		},
		{
			name: "Create Animation",
			icon: Wand2,
			href: "/animations",
			color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20",
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
			href: "/",
			color: "bg-amber-100 text-amber-600 dark:bg-amber-900/20",
			isButton: true,
			onClick: () => subscriptionLevel === "free" && setShowPremiumModal(true),
			disabled: subscriptionLevel !== "free",
		},
	];

	return (
		<Card className="w-full quick-actions" shadow="sm">
			<CardHeader className="flex items-center px-4 py-3">
				<div className="text-sm font-medium">Quick Actions</div>
			</CardHeader>
			<CardBody className="px-4 py-3">
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
			</CardBody>
			<PremiumModal
				isOpen={showPremiumModal}
				onClose={() => setShowPremiumModal(false)}
			/>
		</Card>
	);
}
