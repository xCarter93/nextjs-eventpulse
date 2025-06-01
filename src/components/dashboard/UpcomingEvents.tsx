"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getDaysUntilBirthday } from "@/utils/date";
import { Doc } from "../../../convex/_generated/dataModel";
import { Calendar, Gift, Clock } from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/react";

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
	const user = useQuery(api.users.getUser);

	if (!recipients || !customEvents) return null;

	const daysToShow = user?.settings?.upcomingEvents?.daysToShow ?? 30;
	const maxEvents = user?.settings?.upcomingEvents?.maxEvents ?? 10;

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

	const birthdayEvents: Event[] = recipients.map((r: Doc<"recipients">) => ({
		type: "birthday",
		name: r.name,
		date: new Date(r.birthday),
		daysUntil: getDaysUntilBirthday(new Date(r.birthday)),
	}));

	const customEventsList: Event[] = customEvents.map((e) => ({
		type: "custom",
		name: e.name,
		date: new Date(e.date),
		daysUntil: getDaysUntil(new Date(e.date)),
		isRecurring: e.isRecurring,
	}));

	const allEvents = [...birthdayEvents, ...customEventsList]
		.filter((event) => event.daysUntil >= 0 && event.daysUntil <= daysToShow)
		.sort((a, b) => a.daysUntil - b.daysUntil)
		.slice(0, maxEvents);

	return (
		<div className="w-full upcoming-events">
			<Accordion variant="shadow" selectionMode="multiple" className="w-full">
				<AccordionItem
					key="upcoming-events"
					aria-label="Upcoming Events"
					title={
						<div className="flex items-center justify-between w-full">
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-primary" />
								<span className="text-sm font-medium">Upcoming Events</span>
							</div>
							<div className="text-xs text-gray-500">
								Next {daysToShow} days
							</div>
						</div>
					}
					classNames={{
						trigger:
							"px-4 py-3 data-[hover=true]:bg-gray-50 dark:data-[hover=true]:bg-gray-800/50",
						title: "w-full",
					}}
				>
					<div className="px-4 pb-4">
						{allEvents.length > 0 ? (
							<div className="space-y-3">
								{allEvents.map((event, index) => (
									<div
										key={`${event.name}-${index}`}
										className="flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors"
									>
										<div
											className={`p-2 rounded-full ${
												event.type === "birthday"
													? "bg-pink-100 text-pink-600 dark:bg-pink-900/20"
													: "bg-green-100 text-green-600 dark:bg-green-900/20"
											}`}
										>
											{event.type === "birthday" ? (
												<Gift className="h-3.5 w-3.5" />
											) : (
												<Calendar className="h-3.5 w-3.5" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-sm font-medium truncate">
												{event.name}
												{event.type === "custom" && event.isRecurring && (
													<span className="text-xs text-gray-500 ml-1">↻</span>
												)}
											</div>
											<div className="flex items-center gap-1 text-xs text-gray-500">
												<Clock className="h-3 w-3" />
												<span>
													{event.daysUntil === 0
														? "Today"
														: event.daysUntil === 1
															? "Tomorrow"
															: `In ${event.daysUntil} days`}
												</span>
											</div>
										</div>
										<div
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												event.daysUntil <= 3
													? "bg-red-100 text-red-600 dark:bg-red-900/20"
													: event.daysUntil <= 7
														? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20"
														: "bg-gray-100 text-gray-600 dark:bg-gray-700"
											}`}
										>
											{event.daysUntil === 0
												? "Today"
												: event.daysUntil === 1
													? "1d"
													: `${event.daysUntil}d`}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-6 text-center">
								<Calendar className="h-8 w-8 text-gray-400 mb-2" />
								<div className="text-sm text-gray-500">
									No upcoming events in the next {daysToShow} days
								</div>
							</div>
						)}
					</div>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
