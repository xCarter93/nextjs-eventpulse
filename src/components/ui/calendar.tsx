"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	const years = Array.from(
		{ length: 100 },
		(_, i) => new Date().getFullYear() - i
	);
	const [month, setMonth] = React.useState<Date>(
		props.defaultMonth || new Date()
	);

	function CustomCaption({ displayMonth }: { displayMonth: Date }) {
		return (
			<div className="flex justify-center gap-1">
				<select
					value={displayMonth.getFullYear()}
					onChange={(e) => {
						const newYear = parseInt(e.target.value);
						const newDate = new Date(displayMonth);
						newDate.setFullYear(newYear);
						setMonth(newDate);
					}}
					className="px-2 py-1 text-sm bg-background border rounded-md"
				>
					{years.map((year) => (
						<option key={year} value={year}>
							{year}
						</option>
					))}
				</select>
				<select
					value={displayMonth.getMonth()}
					onChange={(e) => {
						const newMonth = parseInt(e.target.value);
						const newDate = new Date(displayMonth);
						newDate.setMonth(newMonth);
						setMonth(newDate);
					}}
					className="px-2 py-1 text-sm bg-background border rounded-md"
				>
					{Array.from({ length: 12 }, (_, i) => (
						<option key={i} value={i}>
							{new Date(0, i).toLocaleString("default", { month: "long" })}
						</option>
					))}
				</select>
			</div>
		);
	}

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-3", className)}
			month={month}
			onMonthChange={setMonth}
			classNames={{
				months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
				month: "space-y-4",
				caption: "flex justify-center pt-1 relative items-center",
				caption_label: "text-sm font-medium",
				nav: "space-x-1 flex items-center",
				nav_button: cn(
					buttonVariants({ variant: "outline" }),
					"h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
				),
				nav_button_previous: "absolute left-1",
				nav_button_next: "absolute right-1",
				table: "w-full border-collapse space-y-1",
				head_row: "flex",
				head_cell:
					"text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
				row: "flex w-full mt-2",
				cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
				day: cn(
					buttonVariants({ variant: "ghost" }),
					"h-9 w-9 p-0 font-normal aria-selected:opacity-100"
				),
				day_range_end: "day-range-end",
				day_selected:
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
				day_today: "bg-accent text-accent-foreground",
				day_outside:
					"day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
				day_disabled: "text-muted-foreground opacity-50",
				day_range_middle:
					"aria-selected:bg-accent aria-selected:text-accent-foreground",
				day_hidden: "invisible",
				...classNames,
			}}
			components={{
				IconLeft: () => <ChevronLeft className="h-4 w-4" />,
				IconRight: () => <ChevronRight className="h-4 w-4" />,
				Caption: CustomCaption,
			}}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
