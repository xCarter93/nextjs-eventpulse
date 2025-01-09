"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function UserStats() {
	const recipients = useQuery(api.recipients.getRecipients);
	const user = useQuery(api.users.getUser);

	if (!recipients || !user) return null;

	return (
		<div className="flex space-x-4">
			<div className="text-sm text-muted-foreground">
				<span className="font-medium">Recipients:</span> {recipients.length}/
				{user.subscription.features.maxRecipients}
			</div>
			<div className="text-sm text-muted-foreground">
				<span className="font-medium">Plan:</span>{" "}
				{user.subscription.tier === "pro" ? "Pro" : "Free"}
			</div>
		</div>
	);
}
