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
import { useState, useEffect } from "react";
import { SettingsFormData } from "./types";

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
	const [isLoading, setIsLoading] = useState(false);
	const [settings, setSettings] = useState<SettingsFormData>(DEFAULT_SETTINGS);
	const [activeTab, setActiveTab] = useState("general");

	useEffect(() => {
		if (user?.settings) {
			setSettings({
				address: user.settings.address,
				calendar: user.settings.calendar || DEFAULT_SETTINGS.calendar,
				upcomingEvents:
					user.settings.upcomingEvents || DEFAULT_SETTINGS.upcomingEvents,
				notifications:
					user.settings.notifications || DEFAULT_SETTINGS.notifications,
			});
		}
	}, [user?.settings]);

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

	return (
		<div className="container py-6">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Settings</h1>
					<p className="text-muted-foreground mt-2">
						Manage your account settings and preferences.
					</p>
				</div>

				<Separator />

				<Tabs
					defaultValue="general"
					value={activeTab}
					onValueChange={setActiveTab}
					className="space-y-4"
				>
					<TabsList>
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="notifications">Notifications</TabsTrigger>
					</TabsList>

					<TabsContent value="general" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Home Address</CardTitle>
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
									onChange={(address) =>
										setSettings((prev) => ({ ...prev, address }))
									}
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Calendar Settings</CardTitle>
							</CardHeader>
							<CardContent>
								<CalendarSettingsForm
									value={settings.calendar}
									onChange={(calendar) =>
										setSettings((prev) => ({ ...prev, calendar }))
									}
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Upcoming Events</CardTitle>
							</CardHeader>
							<CardContent>
								<UpcomingEventsSettingsForm
									value={settings.upcomingEvents}
									onChange={(upcomingEvents) =>
										setSettings((prev) => ({ ...prev, upcomingEvents }))
									}
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="notifications" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Email Notifications</CardTitle>
							</CardHeader>
							<CardContent>
								<EmailNotificationsForm
									value={settings.notifications}
									onChange={(notifications) =>
										setSettings((prev) => ({ ...prev, notifications }))
									}
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<div className="flex justify-end">
						<Button onClick={handleSubmit} disabled={isLoading}>
							{isLoading ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</Tabs>
			</div>
		</div>
	);
}
