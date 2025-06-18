"use client";

import { Card, CardHeader, CardBody } from "@heroui/react";
import { Plus, Users, Settings, Upload, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PremiumModal } from "../../premium/PremiumModal";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function QuickActionsWidget() {
	const [showPremiumModal, setShowPremiumModal] = useState(false);
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

	const actions = [
		{
			name: "New Email",
			icon: Plus,
			href: "/scheduled-emails/new",
			color: "bg-green-100 text-green-600 dark:bg-green-900/20",
			description: "Schedule email",
		},
		{
			name: "Add Contact",
			icon: Users,
			href: "/recipients",
			color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20",
			description: "Add recipient",
		},
		{
			name: "Upload Animation",
			icon: Upload,
			href: subscriptionLevel === "pro" ? "/animations" : undefined,
			color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20",
			description: "Custom animation",
			isPremium: subscriptionLevel !== "pro",
			onClick:
				subscriptionLevel !== "pro"
					? () => setShowPremiumModal(true)
					: undefined,
		},
		{
			name: "Settings",
			icon: Settings,
			href: "/settings",
			color: "bg-gray-100 text-gray-600 dark:bg-gray-800",
			description: "Configure app",
		},
	];

	return (
		<>
			<Card className="h-[300px]">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<Zap className="h-5 w-5 text-primary" />
						<h3 className="text-lg font-semibold">Quick Actions</h3>
					</div>
				</CardHeader>
				<CardBody className="pt-0">
					<div className="grid grid-cols-2 gap-3">
						{actions.map((action) => {
							const baseClassName = `flex flex-col items-center p-4 rounded-lg transition-all hover:scale-[1.02] hover:shadow-sm ${
								action.onClick ? "cursor-pointer" : ""
							}`;

							const content = (
								<>
									<div
										className={`p-3 rounded-full ${action.color} mb-2 relative`}
									>
										<action.icon className="h-5 w-5" />
										{action.isPremium && (
											<div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
												<span className="text-[8px] font-bold text-yellow-900">
													P
												</span>
											</div>
										)}
									</div>
									<span className="text-sm font-medium text-center mb-1">
										{action.name}
									</span>
									<span className="text-xs text-muted-foreground text-center">
										{action.description}
									</span>
								</>
							);

							return action.href ? (
								<Link
									key={action.name}
									href={action.href}
									className={baseClassName}
								>
									{content}
								</Link>
							) : (
								<div
									key={action.name}
									onClick={action.onClick}
									className={baseClassName}
								>
									{content}
								</div>
							);
						})}
					</div>
				</CardBody>
			</Card>

			<PremiumModal
				isOpen={showPremiumModal}
				onClose={() => setShowPremiumModal(false)}
				featureRequested="upload custom animations"
			/>
		</>
	);
}
