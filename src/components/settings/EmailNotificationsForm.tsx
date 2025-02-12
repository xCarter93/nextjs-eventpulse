"use client";

import { Switch, Input } from "@heroui/react";
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
						<Input
							id="reminder-days"
							type="number"
							min={0}
							max={30}
							value={value.reminderDays.toString()}
							onChange={(e) => handleReminderDaysChange(e.target.value)}
							className="max-w-[180px]"
							label="Reminder Days"
							labelPlacement="outside"
							description="Number of days before an event to send reminders"
							variant="bordered"
						/>
					</div>
				) : (
					<LockedFeature featureDescription="customize reminder days">
						<div className="space-y-2">
							<Input
								id="reminder-days"
								type="number"
								value={DEFAULT_REMINDER_DAYS.toString()}
								className="max-w-[180px]"
								isDisabled
								label="Reminder Days"
								labelPlacement="outside"
								description={`Free users receive reminders ${DEFAULT_REMINDER_DAYS} days before events`}
								variant="bordered"
							/>
						</div>
					</LockedFeature>
				)}

				<div className="space-y-4">
					<h4 className="text-sm font-medium">Email Reminders</h4>
					<div className="space-y-4">
						<div className="flex items-center justify-between space-x-2">
							<div className="flex flex-col">
								<span className="text-sm font-medium">Event Reminders</span>
								<span className="text-sm text-default-500">
									Receive reminders for upcoming events
								</span>
							</div>
							<Switch
								id="events-reminders"
								isSelected={value.emailReminders.events}
								onValueChange={(checked) =>
									handleToggleChange("events", checked)
								}
								color="primary"
								size="lg"
							/>
						</div>

						<div className="flex items-center justify-between space-x-2">
							<div className="flex flex-col">
								<span className="text-sm font-medium">Birthday Reminders</span>
								<span className="text-sm text-default-500">
									Receive reminders for upcoming birthdays
								</span>
							</div>
							<Switch
								id="birthdays-reminders"
								isSelected={value.emailReminders.birthdays}
								onValueChange={(checked) =>
									handleToggleChange("birthdays", checked)
								}
								color="primary"
								size="lg"
							/>
						</div>

						<div className="flex items-center justify-between space-x-2">
							<div className="flex flex-col">
								<span className="text-sm font-medium">Holiday Reminders</span>
								<span className="text-sm text-default-500">
									Receive reminders for upcoming holidays
								</span>
							</div>
							<Switch
								id="holidays-reminders"
								isSelected={value.emailReminders.holidays}
								onValueChange={(checked) =>
									handleToggleChange("holidays", checked)
								}
								color="primary"
								size="lg"
							/>
						</div>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
