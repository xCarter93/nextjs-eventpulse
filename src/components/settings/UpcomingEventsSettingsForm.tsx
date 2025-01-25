"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface UpcomingEventsSettingsFormProps {
	value: {
		daysToShow: number;
		maxEvents: number;
	};
	onChange: (settings: { daysToShow: number; maxEvents: number }) => void;
}

export function UpcomingEventsSettingsForm({
	value,
	onChange,
}: UpcomingEventsSettingsFormProps) {
	const handleInputChange = (
		field: "daysToShow" | "maxEvents",
		inputValue: string
	) => {
		const numValue = parseInt(inputValue);
		if (!isNaN(numValue) && numValue > 0) {
			onChange({
				daysToShow: value.daysToShow,
				maxEvents: value.maxEvents,
				[field]: numValue,
			});
		}
	};

	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="days-to-show" className="flex flex-col space-y-1">
						<span>Days to Show</span>
						<span className="font-normal text-sm text-muted-foreground">
							Number of days to look ahead
						</span>
					</Label>
					<Input
						id="days-to-show"
						type="number"
						min="1"
						max="365"
						value={value.daysToShow}
						onChange={(e) => handleInputChange("daysToShow", e.target.value)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="max-events" className="flex flex-col space-y-1">
						<span>Maximum Events</span>
						<span className="font-normal text-sm text-muted-foreground">
							Maximum number of events to display
						</span>
					</Label>
					<Input
						id="max-events"
						type="number"
						min="1"
						max="50"
						value={value.maxEvents}
						onChange={(e) => handleInputChange("maxEvents", e.target.value)}
					/>
				</div>
			</div>
		</div>
	);
}
