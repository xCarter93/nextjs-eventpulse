import { Button } from "@heroui/react";
import { Calendar, ExternalLink } from "lucide-react";

interface EventCreatedProps {
	name: string;
	date: string;
	isRecurring: boolean;
	eventId: string;
}

export function EventCreated({
	name,
	date,
	isRecurring,
	eventId,
}: EventCreatedProps) {
	return (
		<div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
			<div className="flex items-center gap-2">
				<Calendar className="h-5 w-5 text-green-600" />
				<h3 className="font-semibold text-green-800">
					Event Created Successfully!
				</h3>
			</div>

			<div className="space-y-1">
				<p className="font-medium text-green-700">{name}</p>
				<p className="text-sm text-green-600">
					{date} {isRecurring && "(Recurring annually)"}
				</p>
			</div>

			<Button
				size="sm"
				color="success"
				variant="light"
				startContent={<ExternalLink className="h-4 w-4" />}
				onClick={() => window.open(`/events/${eventId}`, "_blank")}
			>
				View Event
			</Button>
		</div>
	);
}
