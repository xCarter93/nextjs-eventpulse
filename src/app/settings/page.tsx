"use client";

import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AddressForm } from "@/components/settings/AddressForm";
import { CalendarSettingsForm } from "@/components/settings/CalendarSettingsForm";
import { UpcomingEventsSettingsForm } from "@/components/settings/UpcomingEventsSettingsForm";
import { EmailNotificationsForm } from "@/components/settings/EmailNotificationsForm";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
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
			const newSettings = {
				address: user.settings.address,
				calendar: user.settings.calendar || DEFAULT_SETTINGS.calendar,
				upcomingEvents:
					user.settings.upcomingEvents || DEFAULT_SETTINGS.upcomingEvents,
				notifications:
					user.settings.notifications || DEFAULT_SETTINGS.notifications,
			};
			setSettings(newSettings);
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

	const handleSettingsChange = useCallback(
		(
			field: keyof SettingsFormData,
			value: SettingsFormData[keyof SettingsFormData]
		) => {
			setSettings((prev) => ({ ...prev, [field]: value }));
		},
		[]
	);

	return (
		<div className="container space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Settings</h1>
				<p className="mt-2 text-muted-foreground">
					Manage your account settings and preferences.
				</p>
			</div>
			<Separator />

			<Tabs
				defaultValue={activeTab}
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<div className="flex items-center justify-between">
					<TabsList className="bg-secondary/20">
						<TabsTrigger
							value="general"
							className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
						>
							General
						</TabsTrigger>
						<TabsTrigger
							value="notifications"
							className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
						>
							Notifications
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="general" className="space-y-4">
					<Card>
						<CardHeader>
							<h3 className="text-lg font-semibold">Calendar Settings</h3>
						</CardHeader>
						<CardBody>
							<CalendarSettingsForm
								value={settings.calendar}
								onChange={useCallback(
									(calendar) => {
										handleSettingsChange("calendar", calendar);
									},
									[handleSettingsChange]
								)}
							/>
						</CardBody>
					</Card>

					<Card>
						<CardHeader>
							<h3 className="text-lg font-semibold">
								Upcoming Events Settings
							</h3>
						</CardHeader>
						<CardBody>
							<UpcomingEventsSettingsForm
								value={settings.upcomingEvents}
								onChange={useCallback(
									(upcomingEvents) => {
										handleSettingsChange("upcomingEvents", upcomingEvents);
									},
									[handleSettingsChange]
								)}
							/>
						</CardBody>
					</Card>

					<Card>
						<CardHeader>
							<h3 className="text-lg font-semibold">Address</h3>
						</CardHeader>
						<CardBody>
							<AddressForm
								defaultAddress={
									settings.address || {
										city: "",
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
						</CardBody>
					</Card>

					<div className="flex justify-end">
						<Button
							onPress={handleSubmit}
							isDisabled={isLoading}
							color="primary"
							className="bg-purple-500 hover:bg-purple-600"
						>
							{isLoading ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</TabsContent>

				<TabsContent value="notifications" className="space-y-4">
					<Card>
						<CardHeader>
							<h3 className="text-lg font-semibold">Email Notifications</h3>
						</CardHeader>
						<CardBody>
							<EmailNotificationsForm
								value={settings.notifications}
								onChange={useCallback(
									(notifications) => {
										handleSettingsChange("notifications", notifications);
									},
									[handleSettingsChange]
								)}
							/>
						</CardBody>
					</Card>

					<div className="flex justify-end">
						<Button
							onPress={handleSubmit}
							isDisabled={isLoading}
							color="primary"
							className="bg-purple-500 hover:bg-purple-600"
						>
							{isLoading ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
