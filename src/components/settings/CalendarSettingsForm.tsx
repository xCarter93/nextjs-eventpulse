"use client";

import { Switch } from "@heroui/react";

interface CalendarSettingsFormProps {
	value: {
		showHolidays: boolean;
	};
	onChange: (settings: { showHolidays: boolean }) => void;
}

export function CalendarSettingsForm({
	value,
	onChange,
}: CalendarSettingsFormProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between space-x-2">
				<div className="flex flex-col">
					<span className="text-sm font-medium">Show Holidays</span>
					<span className="text-sm text-default-500">
						Display holidays on your calendar
					</span>
				</div>
				<Switch
					id="show-holidays"
					isSelected={value.showHolidays}
					onValueChange={(checked) => onChange({ showHolidays: checked })}
					color="primary"
					size="lg"
				/>
			</div>
		</div>
	);
}
