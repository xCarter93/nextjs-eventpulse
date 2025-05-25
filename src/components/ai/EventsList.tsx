import { Calendar, User } from "lucide-react";

interface Event {
	name: string;
	formattedDate: string;
	type: "event" | "birthday";
	person?: string;
	timestamp: number;
}

interface EventsListProps {
	events: Event[];
	searchTerm?: string;
	dateRange?: string;
}

export function EventsList({ events, searchTerm, dateRange }: EventsListProps) {
	if (events.length === 0) {
		return (
			<div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
				<p className="text-gray-600">
					No events found {dateRange && `for ${dateRange}`}
					{searchTerm && ` matching "${searchTerm}"`}.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 mb-3">
				<Calendar className="h-5 w-5 text-primary" />
				<h3 className="font-semibold">
					Upcoming Events {dateRange && `(${dateRange})`}
				</h3>
			</div>

			<div className="space-y-2">
				{events.map((event, index) => (
					<div
						key={index}
						className="p-3 bg-white border border-gray-200 rounded-lg hover:border-primary/30 transition-colors"
					>
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									{event.type === "birthday" ? (
										<User className="h-4 w-4 text-pink-500" />
									) : (
										<Calendar className="h-4 w-4 text-blue-500" />
									)}
									<span className="font-medium">{event.name}</span>
									{event.type === "birthday" && (
										<span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
											Birthday
										</span>
									)}
								</div>

								<p className="text-sm text-gray-600">{event.formattedDate}</p>

								{event.person && (
									<p className="text-xs text-gray-500 mt-1">
										Person: {event.person}
									</p>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
