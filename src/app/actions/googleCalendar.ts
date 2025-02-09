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
		events.data.items?.map((event) => {
			const startDate = event.start?.date
				? new Date(event.start.date)
				: event.start?.dateTime
					? new Date(event.start.dateTime)
					: new Date();

			const timestamp = event.start?.date
				? Date.UTC(
						startDate.getUTCFullYear(),
						startDate.getUTCMonth(),
						startDate.getUTCDate()
					)
				: startDate.getTime();

			return {
				id: event.id || `event-${Date.now()}`,
				title: event.summary || "Untitled Event",
				description: event.description || undefined,
				start: timestamp,
			};
		}) || []
	);
}
