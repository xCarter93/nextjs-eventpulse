"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { NotificationSettings } from "@/app/settings/types";

interface EmailNotificationsFormProps {
	value: NotificationSettings;
	onChange: (settings: NotificationSettings) => void;
}

export function EmailNotificationsForm({
	value,
	onChange,
}: EmailNotificationsFormProps) {
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

	return (
		<div className="space-y-6">
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

					<div className="flex items-center justify-between space-x-2">
						<Label
							htmlFor="holidays-reminders"
							className="flex flex-col space-y-1"
						>
							<span>Holiday Reminders</span>
							<span className="font-normal text-sm text-muted-foreground">
								Receive reminders for upcoming holidays
							</span>
						</Label>
						<Switch
							id="holidays-reminders"
							checked={value.emailReminders.holidays}
							onCheckedChange={(checked) =>
								handleToggleChange("holidays", checked)
							}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
