import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// This is a simple implementation. You might want to integrate with a holiday API
// or maintain a more comprehensive holiday database
const HOLIDAYS = [
	{
		name: "New Year's Day",
		date: "2024-01-01",
		description: "The first day of the year",
	},
	{
		name: "Valentine's Day",
		date: "2024-02-14",
		description: "A celebration of love",
	},
	{
		name: "St. Patrick's Day",
		date: "2024-03-17",
		description: "Irish cultural celebration",
	},
	{
		name: "Easter",
		date: "2024-03-31",
		description: "Christian holiday celebrating resurrection",
	},
	{ name: "Mother's Day", date: "2024-05-12", description: "Honoring mothers" },
	{ name: "Father's Day", date: "2024-06-16", description: "Honoring fathers" },
	{
		name: "Independence Day",
		date: "2024-07-04",
		description: "US Independence Day",
	},
	{ name: "Halloween", date: "2024-10-31", description: "Spooky celebration" },
	{ name: "Thanksgiving", date: "2024-11-28", description: "Day of gratitude" },
	{
		name: "Christmas Eve",
		date: "2024-12-24",
		description: "Day before Christmas",
	},
	{
		name: "Christmas Day",
		date: "2024-12-25",
		description: "Christian holiday celebrating birth of Jesus",
	},
	{
		name: "New Year's Eve",
		date: "2024-12-31",
		description: "Last day of the year",
	},
];

export const listHolidays = internalQuery({
	args: {
		startDate: v.number(),
		endDate: v.number(),
	},
	handler: async (ctx, args) => {
		const { startDate, endDate } = args;

		return HOLIDAYS.map((holiday) => ({
			...holiday,
			date: new Date(holiday.date).getTime(),
		})).filter(
			(holiday) => holiday.date >= startDate && holiday.date <= endDate
		);
	},
});
