"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressForm } from "@/components/settings/AddressForm";
import { CalendarSettingsForm } from "@/components/settings/CalendarSettingsForm";
import { UpcomingEventsSettingsForm } from "@/components/settings/UpcomingEventsSettingsForm";
import { EmailNotificationsForm } from "@/components/settings/EmailNotificationsForm";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { SettingsFormData } from "./types";
import { createCheckoutSession } from "@/components/premium/actions";
import { Lock, Check } from "lucide-react";
import { env } from "@/env";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const DEFAULT_SETTINGS: SettingsFormData = {
	calendar: {
		showHolidays: true,
	},
	upcomingEvents: {
		daysToShow: 30,
		maxEvents: 10,
	},
	notifications: {
		reminderDays: 7,
		emailReminders: {
			events: true,
			birthdays: true,
			holidays: false,
		},
	},
};

export default function SettingsPage() {
	const user = useQuery(api.users.getUser);
	const updateSettings = useMutation(api.users.updateSettings);
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isUpgrading, setIsUpgrading] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [settings, setSettings] = useState<SettingsFormData>(DEFAULT_SETTINGS);
	const [activeTab, setActiveTab] = useState("subscription");
	const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);

	useEffect(() => {
		if (user?.settings) {
			const newSettings = {
				address: user.settings.address,
				calendar: user.settings.calendar || DEFAULT_SETTINGS.calendar,
				upcomingEvents:
					user.settings.upcomingEvents || DEFAULT_SETTINGS.upcomingEvents,
				notifications:
					user.settings.notifications || DEFAULT_SETTINGS.notifications,
			};

			// Only update if settings actually changed
			if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
				setSettings(newSettings);
			}
		}
	}, [user?.settings, settings]);

	const handleUpgrade = async () => {
		try {
			setIsUpgrading(true);
			const priceId = env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY;

			if (!priceId) {
				throw new Error("Configuration error: Price ID not found");
			}

			const url = await createCheckoutSession(priceId);
			window.location.href = url;
		} catch (error) {
			toast.error("Failed to start upgrade process");
			console.error(error);
		} finally {
			setIsUpgrading(false);
		}
	};

	const handleCancelSubscription = async () => {
		try {
			setIsCancelling(true);
			const stripeSubscriptionId = await cancelSubscription();

			// Call Stripe's cancel endpoint
			const response = await fetch("/api/stripe/cancel", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ subscriptionId: stripeSubscriptionId }),
			});

			if (!response.ok) {
				throw new Error("Failed to cancel subscription");
			}

			toast.success("Your subscription has been cancelled");
			setShowCancelDialog(false);
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Failed to cancel subscription");
			}
			console.error(error);
		} finally {
			setIsCancelling(false);
		}
	};

	const handleSubmit = async () => {
		setIsLoading(true);
		try {
			await updateSettings({
				settings,
			});
			toast.success("Settings updated successfully");
		} catch (error) {
			toast.error("Failed to update settings");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSettingsChange = useCallback(
		(
			field: keyof SettingsFormData,
			value: SettingsFormData[keyof SettingsFormData]
		) => {
			setSettings((prev) => ({ ...prev, [field]: value }));
		},
		[]
	);

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

	return (
		<div className="container py-10">
			<div className="space-y-6">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Settings</h2>
					<p className="text-muted-foreground">
						Manage your account settings and preferences.
					</p>
				</div>
				<Separator />

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList>
						<TabsTrigger value="subscription">Subscription</TabsTrigger>
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="notifications">Notifications</TabsTrigger>
					</TabsList>

					<TabsContent value="subscription" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Current Plan</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-lg font-medium">
											{subscriptionLevel === "pro" ? "Pro Plan" : "Free Plan"}
										</h3>
										<p className="text-sm text-muted-foreground">
											{subscriptionLevel === "pro"
												? "You have access to all features"
												: "Upgrade to unlock all features"}
										</p>
									</div>
									{subscriptionLevel === "free" ? (
										<Button
											onClick={() => handleUpgrade()}
											disabled={isUpgrading}
											className="w-[200px]"
										>
											{isUpgrading ? (
												<>
													<svg
														className="mr-2 h-4 w-4 animate-spin"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
													>
														<circle
															className="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															strokeWidth="4"
														></circle>
														<path
															className="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														></path>
													</svg>
													Upgrading...
												</>
											) : (
												<>
													<Lock className="mr-2 h-4 w-4" />
													Upgrade to Pro
												</>
											)}
										</Button>
									) : (
										<Dialog
											open={showCancelDialog}
											onOpenChange={setShowCancelDialog}
										>
											<DialogTrigger asChild>
												<Button variant="destructive">
													Cancel Subscription
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Cancel Pro Subscription</DialogTitle>
													<div className="space-y-3 pt-4">
														<DialogDescription>
															Are you sure you want to cancel your Pro
															subscription? You&apos;ll lose access to:
														</DialogDescription>
														<ul className="list-disc pl-5 space-y-1">
															<li>Unlimited recipients</li>
															<li>Map view and address management</li>
															<li>Advanced scheduling options</li>
															<li>Permanent animation storage</li>
															<li>Custom events</li>
															<li>Customizable reminder settings</li>
														</ul>
														<div className="font-medium">
															Note: You must remove any extra recipients (above
															the free limit of 5) before cancelling.
														</div>
													</div>
												</DialogHeader>
												<div className="flex justify-end gap-3 pt-4">
													<Button
														variant="outline"
														onClick={() => setShowCancelDialog(false)}
													>
														Keep Subscription
													</Button>
													<Button
														variant="destructive"
														onClick={handleCancelSubscription}
														disabled={isCancelling}
													>
														{isCancelling ? "Cancelling..." : "Yes, Cancel"}
													</Button>
												</div>
											</DialogContent>
										</Dialog>
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
					</TabsContent>

					<TabsContent value="general" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Calendar Settings</CardTitle>
							</CardHeader>
							<CardContent>
								<CalendarSettingsForm
									value={settings.calendar}
									onChange={useCallback(
										(calendar) => {
											handleSettingsChange("calendar", calendar);
										},
										[handleSettingsChange]
									)}
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Upcoming Events Settings</CardTitle>
							</CardHeader>
							<CardContent>
								<UpcomingEventsSettingsForm
									value={settings.upcomingEvents}
									onChange={useCallback(
										(upcomingEvents) => {
											handleSettingsChange("upcomingEvents", upcomingEvents);
										},
										[handleSettingsChange]
									)}
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Address</CardTitle>
							</CardHeader>
							<CardContent>
								<AddressForm
									value={
										settings.address || {
											line1: "",
											city: "",
											state: "",
											postalCode: "",
											country: "",
											countryCode: "",
											coordinates: {
												latitude: 0,
												longitude: 0,
											},
										}
									}
									onChange={useCallback(
										(address) => {
											handleSettingsChange("address", address);
										},
										[handleSettingsChange]
									)}
								/>
							</CardContent>
						</Card>

						<Button onClick={handleSubmit} disabled={isLoading}>
							{isLoading ? "Saving..." : "Save Changes"}
						</Button>
					</TabsContent>

					<TabsContent value="notifications" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Email Notifications</CardTitle>
							</CardHeader>
							<CardContent>
								<EmailNotificationsForm
									value={settings.notifications}
									onChange={useCallback(
										(notifications) => {
											handleSettingsChange("notifications", notifications);
										},
										[handleSettingsChange]
									)}
								/>
							</CardContent>
						</Card>

						<Button onClick={handleSubmit} disabled={isLoading}>
							{isLoading ? "Saving..." : "Save Changes"}
						</Button>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
