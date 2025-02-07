"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { PremiumModal } from "../premium/PremiumModal";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Users, Wand2, Settings, Star } from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/accordion";

export function QuickActions() {
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const [showPremiumModal, setShowPremiumModal] = useState(false);

	const actions = [
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
		<Accordion
			defaultExpandedKeys={["quick-actions"]}
			variant="shadow"
			className="w-full"
		>
			<AccordionItem
				key="quick-actions"
				title="Quick Actions"
				startContent={<Wand2 className="h-4 w-4 text-primary" />}
			>
				<Card
					className="w-full quick-actions shadow-none border-0"
					shadow="none"
				>
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
										className={`flex flex-col items-center p-3 rounded-lg transition-all ${
											action.disabled
												? "opacity-50 cursor-not-allowed"
												: "hover:scale-[1.02] hover:shadow-sm cursor-pointer"
										}`}
									>
										<div className={`p-2 rounded-full ${action.color} mb-2`}>
											<action.icon className="h-4 w-4" />
										</div>
										<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
											{action.name}
										</span>
									</button>
								) : (
									<Link
										key={action.name}
										href={action.href}
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
				</Card>
			</AccordionItem>
			<PremiumModal
				isOpen={showPremiumModal}
				onClose={() => setShowPremiumModal(false)}
			/>
		</Accordion>
	);
}
