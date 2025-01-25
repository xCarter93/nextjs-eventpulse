"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getDaysUntilBirthday } from "@/utils/date";
import { Doc } from "../../../convex/_generated/dataModel";

interface Event {
	type: "birthday" | "custom";
	name: string;
	date: Date;
	daysUntil: number;
	isRecurring?: boolean;
}

export function UpcomingEvents() {
	const recipients = useQuery(api.recipients.getRecipients);
	const customEvents = useQuery(api.events.getEvents);

	if (!recipients || !customEvents) return null;

	const getDaysUntil = (date: Date) => {
		const today = new Date();
		const eventDate = new Date(date);
		eventDate.setFullYear(today.getFullYear());

		if (eventDate < today) {
			eventDate.setFullYear(today.getFullYear() + 1);
		}

		const diffTime = eventDate.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	// Process birthdays
	const birthdayEvents: Event[] = recipients.map((r: Doc<"recipients">) => {
		const date = new Date(r.birthday);
		return {
			type: "birthday",
			name: r.name,
			date,
			daysUntil: getDaysUntilBirthday(date),
		};
	});

	// Process custom events
	const customEventsList: Event[] = customEvents.map((e) => {
		const date = new Date(e.date);
		return {
			type: "custom",
			name: e.name,
			date,
			daysUntil: getDaysUntil(date),
			isRecurring: e.isRecurring,
		};
	});

	// Combine and sort all events
	const allEvents = [...birthdayEvents, ...customEventsList]
		.filter((event) => event.daysUntil >= 0 && event.daysUntil <= 30)
		.sort((a, b) => a.daysUntil - b.daysUntil);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Upcoming Events</CardTitle>
			</CardHeader>
			<CardContent>
				{allEvents.length > 0 ? (
					<div className="space-y-2">
						{allEvents.map((event, index) => (
							<div
								key={`${event.name}-${index}`}
								className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors"
							>
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<div
										className={`w-2.5 h-2.5 rounded-full ${
											event.type === "birthday" ? "bg-pink-500" : "bg-green-500"
										}`}
									/>
									<div className="min-w-0 flex-1">
										<div className="text-sm truncate">
											{event.name}
											{event.type === "custom" && event.isRecurring && (
												<span className="text-xs text-muted-foreground ml-2">
													(Recurring)
												</span>
											)}
										</div>
									</div>
								</div>
								<div className="text-xs font-medium text-muted-foreground px-2.5 py-0.5 bg-muted rounded-md ml-3 w-[4.5rem] text-center">
									{event.daysUntil} {event.daysUntil === 1 ? "day" : "days"}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-sm text-muted-foreground">
						No upcoming events in the next 30 days
					</div>
				)}
			</CardContent>
		</Card>
	);
}
