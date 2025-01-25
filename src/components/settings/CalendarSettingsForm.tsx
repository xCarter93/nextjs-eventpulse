"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
				<Label htmlFor="show-holidays" className="flex flex-col space-y-1">
					<span>Show Holidays</span>
					<span className="font-normal text-sm text-muted-foreground">
						Display holidays on your calendar
					</span>
				</Label>
				<Switch
					id="show-holidays"
					checked={value.showHolidays}
					onCheckedChange={(checked) => onChange({ showHolidays: checked })}
				/>
			</div>
		</div>
	);
}
