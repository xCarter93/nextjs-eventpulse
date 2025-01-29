"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { NotificationSettings } from "@/app/settings/types";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { TooltipProvider } from "@/components/ui/tooltip";

interface EmailNotificationsFormProps {
	value: NotificationSettings;
	onChange: (settings: NotificationSettings) => void;
}

export function EmailNotificationsForm({
	value,
	onChange,
}: EmailNotificationsFormProps) {
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

	const handleReminderDaysChange = (inputValue: string) => {
		const numValue = parseInt(inputValue);
		if (!isNaN(numValue) && numValue >= 0) {
			onChange({
				...value,
				reminderDays: numValue,
			});
		}
	};

	const handleToggleChange = (
		field: keyof NotificationSettings["emailReminders"],
		checked: boolean
	) => {
		onChange({
			...value,
			emailReminders: {
				...value.emailReminders,
				[field]: checked,
			},
		});
	};

	// Default reminder days for free users
	const DEFAULT_REMINDER_DAYS = 7;

	// If user is on free plan and tries to change reminder days, reset to default
	if (
		subscriptionLevel === "free" &&
		value.reminderDays !== DEFAULT_REMINDER_DAYS
	) {
		onChange({
			...value,
			reminderDays: DEFAULT_REMINDER_DAYS,
		});
	}

	return (
		<TooltipProvider>
			<div className="space-y-6">
				{subscriptionLevel === "pro" ? (
					<div className="space-y-2">
						<Label htmlFor="reminder-days" className="flex flex-col space-y-1">
							<span>Reminder Days</span>
							<span className="font-normal text-sm text-muted-foreground">
								Number of days before an event to send reminders
							</span>
						</Label>
						<Input
							id="reminder-days"
							type="number"
							min="0"
							max="30"
							value={value.reminderDays}
							onChange={(e) => handleReminderDaysChange(e.target.value)}
							className="max-w-[180px]"
						/>
					</div>
				) : (
					<LockedFeature featureDescription="customize reminder days">
						<div className="space-y-2">
							<Label
								htmlFor="reminder-days"
								className="flex flex-col space-y-1"
							>
								<span>Reminder Days</span>
								<span className="font-normal text-sm text-muted-foreground">
									Free users receive reminders {DEFAULT_REMINDER_DAYS} days
									before events
								</span>
							</Label>
							<Input
								id="reminder-days"
								type="number"
								value={DEFAULT_REMINDER_DAYS}
								className="max-w-[180px]"
								disabled
							/>
						</div>
					</LockedFeature>
				)}

				<div className="space-y-4">
					<h4 className="text-sm font-medium">Email Reminders</h4>
					<div className="space-y-4">
						<div className="flex items-center justify-between space-x-2">
							<Label
								htmlFor="events-reminders"
								className="flex flex-col space-y-1"
							>
								<span>Event Reminders</span>
								<span className="font-normal text-sm text-muted-foreground">
									Receive reminders for upcoming events
								</span>
							</Label>
							<Switch
								id="events-reminders"
								checked={value.emailReminders.events}
								onCheckedChange={(checked) =>
									handleToggleChange("events", checked)
								}
							/>
						</div>

						<div className="flex items-center justify-between space-x-2">
							<Label
								htmlFor="birthdays-reminders"
								className="flex flex-col space-y-1"
							>
								<span>Birthday Reminders</span>
								<span className="font-normal text-sm text-muted-foreground">
									Receive reminders for upcoming birthdays
								</span>
							</Label>
							<Switch
								id="birthdays-reminders"
								checked={value.emailReminders.birthdays}
								onCheckedChange={(checked) =>
									handleToggleChange("birthdays", checked)
								}
							/>
						</div>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
