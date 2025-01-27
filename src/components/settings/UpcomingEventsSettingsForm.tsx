"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { TooltipProvider } from "@/components/ui/tooltip";

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
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

	const handleInputChange = (
		field: "daysToShow" | "maxEvents",
		inputValue: string
	) => {
		const numValue = parseInt(inputValue);
		if (!isNaN(numValue) && numValue > 0) {
			// For free users, always use default values
			if (subscriptionLevel === "free") {
				onChange({
					daysToShow: DEFAULT_DAYS_TO_SHOW,
					maxEvents: DEFAULT_MAX_EVENTS,
				});
			} else {
				onChange({
					...value,
					[field]: numValue,
				});
			}
		}
	};

	// Default values for free users
	const DEFAULT_DAYS_TO_SHOW = 30;
	const DEFAULT_MAX_EVENTS = 10;

	return (
		<TooltipProvider>
			<div className="space-y-4">
				<div className="grid gap-4 sm:grid-cols-2">
					{subscriptionLevel === "pro" ? (
						<>
							<div className="space-y-2">
								<Label
									htmlFor="days-to-show"
									className="flex flex-col space-y-1"
								>
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
									onChange={(e) =>
										handleInputChange("daysToShow", e.target.value)
									}
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
									onChange={(e) =>
										handleInputChange("maxEvents", e.target.value)
									}
								/>
							</div>
						</>
					) : (
						<LockedFeature featureDescription="customize upcoming events display">
							<div className="space-y-4">
								<div className="space-y-2">
									<Label
										htmlFor="days-to-show"
										className="flex flex-col space-y-1"
									>
										<span>Days to Show</span>
										<span className="font-normal text-sm text-muted-foreground">
											Free users see events for the next {DEFAULT_DAYS_TO_SHOW}{" "}
											days
										</span>
									</Label>
									<Input
										id="days-to-show"
										type="number"
										value={DEFAULT_DAYS_TO_SHOW}
										className="max-w-[180px]"
										disabled
									/>
								</div>

								<div className="space-y-2">
									<Label
										htmlFor="max-events"
										className="flex flex-col space-y-1"
									>
										<span>Maximum Events</span>
										<span className="font-normal text-sm text-muted-foreground">
											Free users see up to {DEFAULT_MAX_EVENTS} events
										</span>
									</Label>
									<Input
										id="max-events"
										type="number"
										value={DEFAULT_MAX_EVENTS}
										className="max-w-[180px]"
										disabled
									/>
								</div>
							</div>
						</LockedFeature>
					)}
				</div>
			</div>
		</TooltipProvider>
	);
}
