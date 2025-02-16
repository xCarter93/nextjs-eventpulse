"use server";

import { env } from "@/env";
import {
	HOLIDAY_CALENDAR_MAP,
	CountryCode,
} from "@/utils/holidayCalendarConfig";

interface GoogleCalendarEvent {
	summary: string;
	description: string;
	start: {
		date: string;
	};
	end: {
		date: string;
	};
	status: string;
}

export async function getPublicHolidays(
	year: number,
	countryCode: string
): Promise<
	Array<{ date: string; name: string; localName: string; type: string }>
> {
	try {
		const apiKey = env.GOOGLE_API_KEY;
		if (!apiKey) {
			throw new Error("Google API key not found");
		}

		if (!(countryCode in HOLIDAY_CALENDAR_MAP)) {
			throw new Error(`Unsupported country code: ${countryCode}`);
		}

		const calendarId = HOLIDAY_CALENDAR_MAP[countryCode as CountryCode];
		const encodedCalendarId = encodeURIComponent(calendarId);

		// Ensure we get the full year of holidays
		const timeMin = `${year}-01-01T00:00:00Z`;
		const timeMax = `${year}-12-31T23:59:59Z`;

		const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;

		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			next: { revalidate: 86400 }, // Cache for 24 hours
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				`Failed to fetch holidays: ${response.status} ${response.statusText}${
					errorData ? ` - ${JSON.stringify(errorData)}` : ""
				}`
			);
		}

		const data = await response.json();
		const events: GoogleCalendarEvent[] = data.items || [];

		// Map the events to the expected format and ensure they're sorted by date
		return events
			.filter((event) => event.status === "confirmed" && event.start?.date)
			.map((event) => ({
				date: event.start.date, // Already in YYYY-MM-DD format
				name: event.summary,
				localName: event.summary,
				type: event.description?.toLowerCase().includes("public")
					? "public_holiday"
					: event.description?.toLowerCase().includes("observance")
						? "observance"
						: "holiday",
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
	} catch (error) {
		console.error("Error fetching holidays:", error);
		return [];
	}
}
