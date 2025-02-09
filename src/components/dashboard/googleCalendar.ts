"use server";

import { env } from "@/env";
import { clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";

export async function getGoogleCalendarEvents(clerkUserId: string) {
	const oAuthClient = await getGoogleOAuthClient(clerkUserId);

	const events = await google.calendar("v3").events.list({
		calendarId: "primary",
		eventTypes: ["default"],
		singleEvents: true,
		timeMin: new Date().toISOString(),
		maxResults: 2500,
		auth: oAuthClient,
	});

	return (
		events.data.items
			?.flatMap((event) => {
				const startDate = event.start?.date ? new Date(event.start.date) : null;
				const endDate = event.end?.date ? new Date(event.end.date) : null;

				// If no valid dates, skip this event
				if (!startDate) {
					return [];
				}

				// For single day events or events without an end date
				if (!endDate || startDate.getTime() === endDate.getTime()) {
					return [
						{
							id: event.id,
							title: event.summary,
							description: event.description,
							start: startDate.toISOString().split("T")[0],
						},
					];
				}

				// For multi-day events, create an entry for each day
				const dates = [];
				const currentDate = new Date(startDate);

				while (currentDate < endDate) {
					dates.push({
						id: `${event.id}-${currentDate.toISOString().split("T")[0]}`,
						title: event.summary,
						description: event.description,
						start: currentDate.toISOString().split("T")[0],
					});
					currentDate.setDate(currentDate.getDate() + 1);
				}

				return dates;
			})
			.filter((date) => date != null) || []
	);
}

async function getGoogleOAuthClient(clerkUserId: string) {
	const clerk = await clerkClient();
	const token = await clerk.users.getUserOauthAccessToken(
		clerkUserId,
		"oauth_google"
	);

	if (!token) {
		throw new Error("No Google OAuth token found");
	}

	const client = new google.auth.OAuth2({
		clientId: env.GOOGLE_OAUTH_CLIENT_ID,
		clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
		redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI,
	});

	client.setCredentials({ access_token: token.data[0].token });

	return client;
}
