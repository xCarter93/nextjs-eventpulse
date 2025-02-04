"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Mail, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { getPublicHolidays } from "@/app/actions/holidays";
import MissingAddressAlert from "./MissingAddressAlert";
import { Card, CardBody, CardHeader, Tooltip } from "@heroui/react";

interface Holiday {
	date: string;
	name: string;
	localName: string;
	type: string;
}

export function Calendar() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [showBirthdays, setShowBirthdays] = useState(true);
	const [showHolidays, setShowHolidays] = useState(true);
	const [showEvents, setShowEvents] = useState(true);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [showEventForm, setShowEventForm] = useState(false);
	const [eventName, setEventName] = useState("");
	const [isRecurring, setIsRecurring] = useState(false);
	const [showPremiumModal, setShowPremiumModal] = useState(false);
	const [holidays, setHolidays] = useState<Holiday[]>([]);
	const router = useRouter();

	// Fetch user settings and other data
	const user = useQuery(api.users.getUser);
	const recipients = useQuery(api.recipients.getRecipients) || [];
	const scheduledEmails =
		useQuery(api.scheduledEmails.listScheduledEmails) || [];
	const customEvents = useQuery(api.events.getEvents) || [];
	const createEvent = useMutation(api.events.createEvent);
	const deleteEvent = useMutation(api.events.deleteEvent);
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

	const hasAddress = user?.settings?.address?.countryCode;
	const showHolidaysEnabled = user?.settings?.calendar?.showHolidays ?? true;

	// Fetch holidays when the year changes or when the user's country code changes
	useEffect(() => {
		async function fetchHolidays() {
			const year = currentDate.getFullYear();
			const countryCode = user?.settings?.address?.countryCode;
			if (!countryCode) return;

			const fetchedHolidays = await getPublicHolidays(year, countryCode);
			setHolidays(fetchedHolidays);
		}

		if (hasAddress && showHolidaysEnabled) {
			fetchHolidays();
		} else {
			setHolidays([]);
		}
	}, [
		currentDate,
		hasAddress,
		showHolidaysEnabled,
		user?.settings?.address?.countryCode,
	]);

	const birthdays = recipients.map((r) => ({
		date: new Date(r.birthday),
		name: r.name,
	}));

	const daysInMonth = new Date(
		currentDate.getFullYear(),
		currentDate.getMonth() + 1,
		0
	).getDate();

	const firstDayOfMonth = new Date(
		currentDate.getFullYear(),
		currentDate.getMonth(),
		1
	).getDay();

	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	const navigateMonth = (direction: "prev" | "next") => {
		setCurrentDate(
			new Date(
				currentDate.getFullYear(),
				direction === "prev"
					? currentDate.getMonth() - 1
					: currentDate.getMonth() + 1,
				1
			)
		);
	};

	const handleDayClick = (day: number) => {
		const date = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			day
		);
		setSelectedDate(date);
		setShowEventForm(false);
		setIsDialogOpen(true);
	};

	const handleCreateEvent = async () => {
		if (selectedDate && eventName) {
			await createEvent({
				name: eventName,
				date: selectedDate.getTime(),
				isRecurring,
			});
			setEventName("");
			setIsRecurring(false);
			setShowEventForm(false);
			setIsDialogOpen(false);
		}
	};

	const handleScheduleEmail = () => {
		if (selectedDate) {
			router.push(`/scheduled-emails/new?date=${selectedDate.getTime()}`);
		}
	};

	const startEventCreation = () => {
		if (subscriptionLevel === "pro") {
			setShowEventForm(true);
		} else {
			setShowPremiumModal(true);
		}
	};

	const handleDeleteEvent = async (eventId: Id<"customEvents">) => {
		await deleteEvent({ id: eventId });
	};

	const getSelectedDayEvents = () => {
		if (!selectedDate) return [];
		return customEvents.filter((event) => {
			const eventDate = new Date(event.date);
			return (
				eventDate.getDate() === selectedDate.getDate() &&
				eventDate.getMonth() === selectedDate.getMonth() &&
				eventDate.getFullYear() === selectedDate.getFullYear()
			);
		});
	};

	const getDayEvents = (day: number) => {
		const currentDateStr = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			day
		)
			.toISOString()
			.split("T")[0];

		const dayBirthdays = showBirthdays
			? birthdays.filter((birthday) => {
					const birthdayDate = new Date(birthday.date);
					return (
						birthdayDate.getDate() === day &&
						birthdayDate.getMonth() === currentDate.getMonth()
					);
				})
			: [];

		const dayHolidays =
			showHolidays && hasAddress && showHolidaysEnabled
				? holidays.filter((holiday) => holiday.date === currentDateStr)
				: [];

		const dayCustomEvents = showEvents
			? customEvents.filter((event) => {
					const eventDate = new Date(event.date);
					return (
						eventDate.getDate() === day &&
						eventDate.getMonth() === currentDate.getMonth() &&
						eventDate.getFullYear() === currentDate.getFullYear()
					);
				})
			: [];

		const dayScheduledEmails = scheduledEmails.filter((email) => {
			const emailDate = new Date(email.scheduledTime);
			return (
				email.status === "pending" &&
				emailDate.getDate() === day &&
				emailDate.getMonth() === currentDate.getMonth() &&
				emailDate.getFullYear() === currentDate.getFullYear()
			);
		});

		return {
			birthdays: dayBirthdays,
			holidays: dayHolidays,
			customEvents: dayCustomEvents,
			scheduledEmails: dayScheduledEmails,
		};
	};

	return (
		<div className="w-full h-full bg-card rounded-lg shadow-sm calendar">
			{/* Address Required Banner */}
			{!hasAddress && showHolidays && showHolidaysEnabled && (
				<div className="p-4">
					<MissingAddressAlert />
				</div>
			)}

			{/* Calendar Header */}
			<div className="flex items-center justify-between p-4 border-b">
				<div>
					<h2 className="text-lg font-semibold">
						{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
					</h2>
					<div className="flex gap-4 mt-1">
						<button
							onClick={() => setShowBirthdays(!showBirthdays)}
							className={cn(
								"flex items-center gap-2 text-sm transition-opacity",
								!showBirthdays && "opacity-50"
							)}
						>
							<div className="w-2 h-2 rounded-full bg-pink-500" />
							<span className="text-muted-foreground">Birthdays</span>
						</button>
						{(hasAddress || !showHolidaysEnabled) && (
							<button
								onClick={() => setShowHolidays(!showHolidays)}
								className={cn(
									"flex items-center gap-2 text-sm transition-opacity",
									!showHolidays && "opacity-50"
								)}
							>
								<div className="w-2 h-2 rounded-full bg-blue-500" />
								<span className="text-muted-foreground">Holidays</span>
							</button>
						)}
						<button
							onClick={() => setShowEvents(!showEvents)}
							className={cn(
								"flex items-center gap-2 text-sm transition-opacity",
								!showEvents && "opacity-50"
							)}
						>
							<div className="w-2 h-2 rounded-full bg-green-500" />
							<span className="text-muted-foreground">Events</span>
						</button>
					</div>
				</div>
				<div className="flex space-x-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => navigateMonth("prev")}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={() => navigateMonth("next")}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Calendar Grid */}
			<div className="p-4">
				{/* Weekday Headers */}
				<div className="grid grid-cols-7 gap-2 mb-2">
					{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
						<div
							key={day}
							className="pl-2 text-sm font-medium text-muted-foreground"
						>
							{day}
						</div>
					))}
				</div>

				{/* Calendar Days */}
				<div className="grid grid-cols-7 gap-2">
					{/* Empty cells for days before the first day of the month */}
					{Array.from({ length: firstDayOfMonth }).map((_, index) => (
						<Card
							key={`empty-${index}`}
							className="aspect-square opacity-50"
							shadow="none"
						>
							<CardBody className="p-1" />
						</Card>
					))}

					{/* Actual days of the month */}
					{Array.from({ length: daysInMonth }).map((_, index) => {
						const day = index + 1;
						const events = getDayEvents(day);
						const isToday =
							day === new Date().getDate() &&
							currentDate.getMonth() === new Date().getMonth() &&
							currentDate.getFullYear() === new Date().getFullYear();

						return (
							<Card
								key={day}
								isPressable
								isHoverable
								onPress={() => handleDayClick(day)}
								className={cn(
									"aspect-square relative group transition-all duration-200",
									isToday && [
										"border-2 border-orange-400",
										"bg-gradient-to-br from-orange-50 to-transparent",
										"shadow-[0_0_12px_rgba(251,146,60,0.3)]",
										"dark:from-orange-950/30 dark:to-transparent",
									],
									"hover:scale-[1.02] hover:-translate-y-0.5"
								)}
								shadow="sm"
								radius="sm"
							>
								{/* Event Indicators - Moved before CardHeader */}
								{(events.birthdays.length > 0 ||
									events.holidays.length > 0 ||
									events.customEvents.length > 0) && (
									<div className="absolute top-0 inset-x-0 flex h-1 gap-px z-20">
										{events.birthdays.length > 0 && (
											<div className="flex-1 bg-pink-500" />
										)}
										{events.holidays.length > 0 && (
											<div className="flex-1 bg-blue-500" />
										)}
										{events.customEvents.length > 0 && (
											<div className="flex-1 bg-green-500" />
										)}
									</div>
								)}
								<CardHeader className="p-1">
									<span className="text-sm font-medium">{day}</span>
								</CardHeader>
								<CardBody className="p-1 relative">
									{events.scheduledEmails.length > 0 && (
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="flex items-center gap-1 text-sm text-muted-foreground">
												<span>{events.scheduledEmails.length}</span>
												<Mail className="w-3 h-3" />
											</div>
										</div>
									)}
								</CardBody>
								{/* Event tooltip - Simplified content */}
								{(events.birthdays.length > 0 ||
									events.holidays.length > 0 ||
									events.customEvents.length > 0 ||
									events.scheduledEmails.length > 0) && (
									<Tooltip
										content={
											<div className="p-2 space-y-2 max-w-[256px]">
												{events.birthdays.map((birthday, i) => (
													<div key={i} className="flex items-center gap-2">
														<span className="w-2 h-2 rounded-full bg-pink-500" />
														<span className="text-sm">
															{birthday.name}&apos;s Birthday
														</span>
													</div>
												))}
												{events.holidays.map((holiday, i) => (
													<div key={i} className="flex flex-col gap-1">
														<div className="flex items-center gap-2">
															<span className="w-2 h-2 rounded-full bg-blue-500" />
															<span className="text-sm">
																{holiday.localName}
															</span>
														</div>
														<span className="text-xs text-muted-foreground pl-4 capitalize">
															{holiday.type.replace(/_/g, " ")}
														</span>
													</div>
												))}
												{events.customEvents.map((event, i) => (
													<div key={i} className="flex items-center gap-2">
														<span className="w-2 h-2 rounded-full bg-green-500" />
														<span className="text-sm">
															{event.name}
															{event.isRecurring && " (Recurring)"}
														</span>
													</div>
												))}
												{events.scheduledEmails.map((email, i) => (
													<div key={i} className="flex flex-col gap-1">
														<div className="flex items-center gap-2">
															<Mail className="w-3 h-3" />
															<span className="text-sm">
																{email.isAutomated
																	? "Automated Email"
																	: "Custom Email"}{" "}
																to {email.recipient.name}
															</span>
														</div>
														{email.subject && (
															<span className="text-xs text-muted-foreground pl-4">
																{email.subject}
															</span>
														)}
													</div>
												))}
											</div>
										}
										placement="top"
										delay={0}
										closeDelay={0}
										offset={10}
										classNames={{
											base: "bg-popover text-popover-foreground rounded-md shadow-lg",
											content: "break-words",
										}}
									>
										<div className="absolute inset-0" />
									</Tooltip>
								)}
							</Card>
						);
					})}
				</div>
			</div>

			{/* Event Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{selectedDate?.toLocaleDateString()}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						{!showEventForm ? (
							<>
								<div className="grid grid-cols-2 gap-4">
									<Button
										onClick={startEventCreation}
										variant="outline"
										className="flex items-center gap-2 h-24 text-lg relative"
									>
										<CalendarIcon className="h-5 w-5" />
										Create Event
										{subscriptionLevel !== "pro" && (
											<div className="absolute top-2 right-2">
												<Lock className="h-4 w-4" />
											</div>
										)}
									</Button>
									<Button
										onClick={handleScheduleEmail}
										variant="outline"
										className="flex items-center gap-2 h-24 text-lg"
									>
										<Mail className="h-5 w-5" />
										Schedule Email
									</Button>
								</div>
								{getSelectedDayEvents().length > 0 && (
									<div className="space-y-2">
										<div className="text-sm font-medium text-muted-foreground">
											Existing Events
										</div>
										<div className="space-y-1">
											{getSelectedDayEvents().map((event) => (
												<div
													key={event._id}
													className="flex items-center justify-between rounded-md border px-4 py-2"
												>
													<div className="flex items-center gap-2">
														<div className="w-2 h-2 rounded-full bg-green-500" />
														<span>
															{event.name}
															{event.isRecurring && (
																<span className="text-xs text-muted-foreground ml-2">
																	(Recurring)
																</span>
															)}
														</span>
													</div>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-muted-foreground hover:text-destructive"
														onClick={() => handleDeleteEvent(event._id)}
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
											))}
										</div>
									</div>
								)}
							</>
						) : (
							<div className="space-y-4 animate-in fade-in zoom-in duration-200">
								<div className="space-y-2">
									<Label htmlFor="event-name">Event Name</Label>
									<Input
										id="event-name"
										value={eventName}
										onChange={(e) => setEventName(e.target.value)}
										placeholder="Enter event name"
									/>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="recurring"
										checked={isRecurring}
										onCheckedChange={(checked) =>
											setIsRecurring(checked as boolean)
										}
									/>
									<Label htmlFor="recurring">Recurring event</Label>
								</div>
								<div className="flex justify-end gap-2 pt-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowEventForm(false)}
									>
										Back
									</Button>
									<Button
										type="button"
										onClick={handleCreateEvent}
										disabled={!eventName}
									>
										Create Event
									</Button>
								</div>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Premium Modal */}
			<PremiumModal
				isOpen={showPremiumModal}
				onClose={() => setShowPremiumModal(false)}
				featureRequested="create custom events"
			/>
		</div>
	);
}
