"use client";

import { Input } from "@heroui/react";
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
			<div className="w-full">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{subscriptionLevel === "pro" ? (
						<>
							<div className="w-full">
								<Input
									id="days-to-show"
									type="number"
									min={1}
									max={365}
									value={value.daysToShow.toString()}
									onChange={(e) =>
										handleInputChange("daysToShow", e.target.value)
									}
									label="Days to Show"
									labelPlacement="outside"
									description="Number of days to look ahead"
									variant="bordered"
									className="w-full"
								/>
							</div>

							<div className="w-full">
								<Input
									id="max-events"
									type="number"
									min={1}
									max={50}
									value={value.maxEvents.toString()}
									onChange={(e) =>
										handleInputChange("maxEvents", e.target.value)
									}
									label="Maximum Events"
									labelPlacement="outside"
									description="Maximum number of events to display"
									variant="bordered"
									className="w-full"
								/>
							</div>
						</>
					) : (
						<>
							<div className="w-full">
								<LockedFeature featureDescription="customize upcoming events display">
									<Input
										id="days-to-show"
										type="number"
										value={DEFAULT_DAYS_TO_SHOW.toString()}
										isDisabled
										label="Days to Show"
										labelPlacement="outside"
										description={`Free users see events for the next ${DEFAULT_DAYS_TO_SHOW} days`}
										variant="bordered"
										className="w-full"
									/>
								</LockedFeature>
							</div>

							<div className="w-full">
								<LockedFeature featureDescription="customize upcoming events display">
									<Input
										id="max-events"
										type="number"
										value={DEFAULT_MAX_EVENTS.toString()}
										isDisabled
										label="Maximum Events"
										labelPlacement="outside"
										description={`Free users see up to ${DEFAULT_MAX_EVENTS} events`}
										variant="bordered"
										className="w-full"
									/>
								</LockedFeature>
							</div>
						</>
					)}
				</div>
			</div>
		</TooltipProvider>
	);
}
