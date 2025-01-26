"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getSubscriptionLimits } from "@/lib/subscriptions";
import { InfinityIcon } from "lucide-react";

export function UserStats() {
	const recipients = useQuery(api.recipients.getRecipients);
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const limits = getSubscriptionLimits(subscriptionLevel ?? "free");

	if (!recipients) return null;

	return (
		<div className="flex space-x-4">
			<div className="text-sm text-muted-foreground">
				<span className="font-medium">Recipients:</span> {recipients.length}/
				{limits.maxRecipients === Infinity ? (
					<InfinityIcon className="inline h-4 w-4" />
				) : (
					limits.maxRecipients
				)}
			</div>
			<div className="text-sm text-muted-foreground">
				<span className="font-medium">Plan:</span>{" "}
				{subscriptionLevel === "pro" ? "Pro" : "Free"}
			</div>
		</div>
	);
}
