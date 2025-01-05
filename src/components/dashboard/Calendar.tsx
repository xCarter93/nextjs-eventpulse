"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarProps {
	birthdays: Array<{
		date: Date;
		name: string;
	}>;
	holidays?: Array<{
		date: string;
		name: string;
		localName: string;
		type: string;
	}>;
	className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
	birthdays = [],
	holidays = [],
	className,
}) => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [showBirthdays, setShowBirthdays] = useState(true);
	const [showHolidays, setShowHolidays] = useState(true);
	const today = new Date();

	const isCurrentMonth =
		currentDate.getMonth() === today.getMonth() &&
		currentDate.getFullYear() === today.getFullYear();

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
		setCurrentDate((prev) => {
			const newDate = new Date(prev);
			if (direction === "prev") {
				newDate.setMonth(prev.getMonth() - 1);
			} else {
				newDate.setMonth(prev.getMonth() + 1);
			}
			return newDate;
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

		const dayHolidays = showHolidays
			? holidays.filter((holiday) => holiday.date === currentDateStr)
			: [];

		return { birthdays: dayBirthdays, holidays: dayHolidays };
	};

	return (
		<div className={cn("w-full rounded-lg bg-card", className)}>
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
					</div>
				</div>
				<div className="flex space-x-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => navigateMonth("prev")}
						disabled={isCurrentMonth}
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
				<div className="grid grid-cols-7 gap-1 mb-2">
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
				<div className="grid grid-cols-7 gap-1">
					{/* Empty cells for days before the first day of the month */}
					{Array.from({ length: firstDayOfMonth }).map((_, index) => (
						<div
							key={`empty-${index}`}
							className="aspect-square p-1 text-center text-muted-foreground/50 border border-border/50"
						/>
					))}

					{/* Actual days of the month */}
					{Array.from({ length: daysInMonth }).map((_, index) => {
						const day = index + 1;
						const events = getDayEvents(day);
						const hasEvents =
							events.birthdays.length > 0 || events.holidays.length > 0;
						const isToday =
							day === new Date().getDate() &&
							currentDate.getMonth() === new Date().getMonth() &&
							currentDate.getFullYear() === new Date().getFullYear();

						return (
							<div
								key={day}
								className={cn(
									"aspect-square p-1 relative group hover:bg-accent/50 rounded-sm transition-colors border border-border",
									isToday && "bg-accent/30 border-accent"
								)}
							>
								{hasEvents && (
									<div className="absolute top-0 inset-x-0 flex h-1">
										{events.birthdays.length > 0 && (
											<div className="flex-1 bg-pink-500 rounded-t-sm" />
										)}
										{events.holidays.length > 0 && (
											<div className="flex-1 bg-blue-500 rounded-t-sm" />
										)}
									</div>
								)}
								<span className="text-sm block pl-1">{day}</span>
								{/* Event tooltip */}
								{hasEvents && (
									<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
										<div className="bg-popover text-popover-foreground text-sm rounded-md shadow-lg p-2 whitespace-nowrap">
											{events.birthdays.map((birthday, i) => (
												<div key={i} className="flex items-center gap-2">
													<span className="w-2 h-2 rounded-full bg-pink-500" />
													<span>{birthday.name}&apos;s Birthday</span>
												</div>
											))}
											{events.holidays.map((holiday, i) => (
												<div key={i} className="flex flex-col gap-1">
													<div className="flex items-center gap-2">
														<span className="w-2 h-2 rounded-full bg-blue-500" />
														<span>{holiday.localName}</span>
													</div>
													<span className="text-xs text-muted-foreground pl-4 capitalize">
														{holiday.type.replace(/_/g, " ")}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default Calendar;
