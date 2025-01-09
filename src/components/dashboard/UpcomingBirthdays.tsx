"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { getDaysUntilBirthday, isWithinDays } from "@/utils/date";

export function UpcomingBirthdays() {
	const recipients = useQuery(api.recipients.getRecipients) || [];

	const recipientsWithDate = recipients.map((r) => ({
		...r,
		birthday: new Date(r.birthday),
	}));

	const upcomingBirthdays = recipientsWithDate
		.filter((recipient) => isWithinDays(recipient.birthday, 30))
		.sort(
			(a, b) =>
				getDaysUntilBirthday(a.birthday) - getDaysUntilBirthday(b.birthday)
		);

	return (
		<div className="bg-card p-6 rounded-lg shadow-sm">
			<h2 className="text-lg font-semibold mb-4 text-card-foreground">
				Upcoming Birthdays
			</h2>
			{upcomingBirthdays.length > 0 ? (
				<div className="space-y-4">
					{upcomingBirthdays.map((recipient) => (
						<div
							key={recipient._id}
							className="flex justify-between items-center p-3 bg-muted rounded-md"
						>
							<div>
								<p className="font-medium text-foreground">{recipient.name}</p>
								<p className="text-sm text-muted-foreground">
									in {getDaysUntilBirthday(recipient.birthday)} days
								</p>
							</div>
							<Button variant="outline">Create Greeting</Button>
						</div>
					))}
				</div>
			) : (
				<p className="text-muted-foreground">
					No upcoming birthdays in the next 30 days
				</p>
			)}
		</div>
	);
}
