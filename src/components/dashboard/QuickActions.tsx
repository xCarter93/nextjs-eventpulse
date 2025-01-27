"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { PremiumModal } from "../premium/PremiumModal";

export function QuickActions() {
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const [showPremiumModal, setShowPremiumModal] = useState(false);

	return (
		<div className="bg-card p-6 rounded-lg shadow-sm">
			<h2 className="text-lg font-semibold mb-4 text-card-foreground">
				Quick Actions
			</h2>
			<div className="grid grid-cols-2 gap-4">
				<Link
					href="/recipients"
					className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
				>
					<span className="text-xl mb-2">👥</span>
					<span className="text-sm font-medium text-foreground">
						Add Recipient
					</span>
				</Link>
				<Link
					href="/animations"
					className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
				>
					<span className="text-xl mb-2">✨</span>
					<span className="text-sm font-medium text-foreground">
						Create Animation
					</span>
				</Link>
				<Link
					href="/settings"
					className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
				>
					<span className="text-xl mb-2">⚙️</span>
					<span className="text-sm font-medium text-foreground">Settings</span>
				</Link>
				<button
					onClick={() =>
						subscriptionLevel === "free" && setShowPremiumModal(true)
					}
					className={`flex flex-col items-center p-4 bg-muted rounded-lg transition-colors ${
						subscriptionLevel === "free"
							? "hover:bg-muted/80 cursor-pointer"
							: "opacity-50 cursor-not-allowed"
					}`}
				>
					<span className="text-xl mb-2">⭐</span>
					<span className="text-sm font-medium text-foreground">
						Upgrade Plan
					</span>
				</button>
			</div>
			<PremiumModal
				isOpen={showPremiumModal}
				onClose={() => setShowPremiumModal(false)}
			/>
		</div>
	);
}
