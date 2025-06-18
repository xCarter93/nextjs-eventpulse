"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { Calendar, Gift, Clock, ArrowRight } from "lucide-react";
import { getDaysUntilBirthday } from "@/utils/date";
import { Doc } from "../../../../convex/_generated/dataModel";
import Link from "next/link";

interface Event {
	type: "birthday" | "custom" | "holiday";
	name: string;
	date: Date;
	daysUntil: number;
	isRecurring?: boolean;
}

export function UpcomingEventsWidget() {
	const recipients = useQuery(api.recipients.getRecipients);
	const customEvents = useQuery(api.events.getEvents);
	const user = useQuery(api.users.getUser);

	if (!recipients || !customEvents) {
		return (
			<Card className="h-[300px]">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Calendar className="h-5 w-5 text-primary" />
						<h3 className="text-lg font-semibold">Upcoming Events</h3>
					</div>
				</CardHeader>
				<CardBody className="animate-pulse">
					<div className="space-y-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex items-center gap-3">
								<div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
								<div className="flex-1">
									<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
									<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
								</div>
							</div>
						))}
					</div>
				</CardBody>
			</Card>
		);
	}

	const daysToShow = user?.settings?.upcomingEvents?.daysToShow ?? 30;

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
		name: `${r.name}'s Birthday`,
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

	// TODO: Add holiday events from backend
	// const holidayEvents: Event[] = []; // Placeholder for future holiday integration

	const allEvents = [...birthdayEvents, ...customEventsList]
		.filter((event) => event.daysUntil >= 0 && event.daysUntil <= daysToShow)
		.sort((a, b) => a.daysUntil - b.daysUntil)
		.slice(0, 5); // Show only top 5 events

	const getEventIcon = (type: Event["type"]) => {
		switch (type) {
			case "birthday":
				return Gift;
			case "custom":
				return Calendar;
			case "holiday":
				return Calendar;
			default:
				return Calendar;
		}
	};

	const getEventColor = (type: Event["type"]) => {
		switch (type) {
			case "birthday":
				return "text-pink-600 bg-pink-100 dark:bg-pink-900/20";
			case "custom":
				return "text-green-600 bg-green-100 dark:bg-green-900/20";
			case "holiday":
				return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
			default:
				return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
		}
	};

	return (
		<Card className="h-[300px]">
			<CardHeader className="flex flex-row items-center justify-between pb-3">
				<div className="flex items-center gap-2">
					<Calendar className="h-5 w-5 text-primary" />
					<h3 className="text-lg font-semibold">Upcoming Events</h3>
				</div>
				<Link
					href="/dashboard"
					className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
				>
					View All
					<ArrowRight className="h-3 w-3" />
				</Link>
			</CardHeader>
			<CardBody className="pt-0">
				{allEvents.length > 0 ? (
					<div className="space-y-3">
						{allEvents.map((event, index) => {
							const IconComponent = getEventIcon(event.type);
							const colorClasses = getEventColor(event.type);

							return (
								<div
									key={`${event.name}-${index}`}
									className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
								>
									<div className={`p-2 rounded-full ${colorClasses}`}>
										<IconComponent className="h-4 w-4" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium truncate">
											{event.name}
											{event.isRecurring && (
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
														: `${event.daysUntil} days`}
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
										{event.daysUntil === 0 ? "Today" : `${event.daysUntil}d`}
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<Calendar className="h-12 w-12 text-gray-400 mb-3" />
						<div className="text-sm text-gray-500 mb-1">No upcoming events</div>
						<div className="text-xs text-gray-400">
							in the next {daysToShow} days
						</div>
					</div>
				)}
			</CardBody>
		</Card>
	);
}
