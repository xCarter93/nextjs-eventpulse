"use client";

import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { ManageSubscriptionButton } from "@/components/billing/ManageSubscriptionButton";
import { GetSubscriptionButton } from "@/components/billing/GetSubscriptionButton";
import { format } from "date-fns";
import { Stripe } from "stripe";
import { useQuery, useAction } from "convex/react";
import { useEffect, useState } from "react";

export default function Page() {
	const { userId } = useAuth();
	const subscription = useQuery(api.subscriptions.getActiveSubscription);
	const [priceInfo, setPriceInfo] =
		useState<Stripe.Response<Stripe.Price> | null>(null);
	const getPrice = useAction(api.subscriptions.getSubscriptionPrice);

	useEffect(() => {
		if (subscription?.stripePriceId) {
			getPrice({ priceId: subscription.stripePriceId }).then(setPriceInfo);
		} else {
			setPriceInfo(null);
		}
	}, [subscription?.stripePriceId, getPrice]);

	if (!userId) {
		return null;
	}

	const features = [
		{ name: "View recipient locations on a map", pro: true },
		{ name: "Add recipient addresses", pro: true },
		{ name: "Unlimited recipients", pro: true },
		{ name: "Schedule emails as far in advance as you want", pro: true },
		{ name: "Permanent storage for custom animations", pro: true },
		{ name: "Add custom events", pro: true },
		{ name: "Customize reminder settings", pro: true },
		{ name: "Basic email scheduling (7 days)", free: true },
		{ name: "Up to 5 recipients", free: true },
		{ name: "Custom animations (10 days storage)", free: true },
		{ name: "Default reminder settings", free: true },
	];

	// A subscription is active if it exists and hasn't expired yet
	const isSubscriptionActive =
		subscription && new Date(subscription.stripeCurrentPeriodEnd) > new Date();

	return (
		<div className="container py-10">
			<div className="space-y-6">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Billing</h2>
					<p className="text-muted-foreground">
						Manage your subscription and billing settings.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Current Plan</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<h3 className="text-lg font-medium">
									{(priceInfo?.product as Stripe.Product)?.name || "Free Plan"}
								</h3>
								<p className="text-sm text-muted-foreground">
									{isSubscriptionActive
										? "You have access to all features"
										: "Upgrade to unlock all features"}
								</p>
								{subscription?.stripeCancelAtPeriodEnd && (
									<p className="text-sm text-destructive">
										Your subscription will be canceled on{" "}
										{format(
											new Date(subscription.stripeCurrentPeriodEnd),
											"MMMM dd, yyyy"
										)}
									</p>
								)}
							</div>
							{isSubscriptionActive ? (
								<ManageSubscriptionButton />
							) : (
								<GetSubscriptionButton />
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<h4 className="font-medium">Pro Features</h4>
								<ul className="space-y-3">
									{features
										.filter((f) => f.pro)
										.map((feature, i) => (
											<li key={i} className="flex items-start gap-2">
												<Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
												<span className="text-sm">{feature.name}</span>
											</li>
										))}
								</ul>
							</div>
							<div className="space-y-4">
								<h4 className="font-medium">Free Features</h4>
								<ul className="space-y-3">
									{features
										.filter((f) => f.free)
										.map((feature, i) => (
											<li key={i} className="flex items-start gap-2">
												<Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
												<span className="text-sm">{feature.name}</span>
											</li>
										))}
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
