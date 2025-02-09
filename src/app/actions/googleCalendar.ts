"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";
import { google } from "googleapis";

export async function getGoogleCalendarEvents() {
	const { userId } = await auth();
	if (!userId) {
		throw new Error("Not authenticated");
	}

	const clerk = await clerkClient();
	const tokens = await clerk.users.getUserOauthAccessToken(
		userId,
		"oauth_google"
	);

	if (!tokens) {
		throw new Error("No Google OAuth token found");
	}

	const client = new google.auth.OAuth2({
		clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
		clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
		redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
	});

	client.setCredentials({ access_token: tokens.data[0].token });

	const events = await google.calendar("v3").events.list({
		calendarId: "primary",
		eventTypes: ["default"],
		singleEvents: true,
		timeMin: new Date().toISOString(),
		maxResults: 2500,
		auth: client,
		timeZone: "UTC",
	});

	return (
		events.data.items?.flatMap((event) => {
			// Handle all-day events
			if (event.start?.date) {
				// For all-day events, create dates at local midnight
				// Create date in UTC to avoid timezone offset issues
				const [year, month, day] = event.start.date.split("-").map(Number);
				const startDate = new Date(Date.UTC(year, month - 1, day));

				// Get end date similarly if it exists
				let endDate;
				if (event.end?.date) {
					const [endYear, endMonth, endDay] = event.end.date
						.split("-")
						.map(Number);
					endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));
				} else {
					endDate = new Date(startDate);
				}

				// If it's a multi-day event
				if (endDate > startDate) {
					const dates = [];
					const currentDate = new Date(startDate);

					// Create an event for each day until the end date (exclusive)
					while (currentDate < endDate) {
						dates.push({
							id: `${event.id}-${currentDate.toISOString().split("T")[0]}`,
							title: event.summary || "Untitled Event",
							description: event.description || undefined,
							start: currentDate.getTime(),
						});
						// Move to next day using UTC to avoid timezone issues
						currentDate.setUTCDate(currentDate.getUTCDate() + 1);
					}
					return dates;
				}

				// Single day event
				return [
					{
						id: event.id || `event-${Date.now()}`,
						title: event.summary || "Untitled Event",
						description: event.description || undefined,
						start: startDate.getTime(),
					},
				];
			}

			// Handle time-specific events
			const timestamp = event.start?.dateTime
				? new Date(event.start.dateTime).getTime()
				: new Date().getTime();

			return [
				{
					id: event.id || `event-${Date.now()}`,
					title: event.summary || "Untitled Event",
					description: event.description || undefined,
					start: timestamp,
				},
			];
		}) || []
	);
}
