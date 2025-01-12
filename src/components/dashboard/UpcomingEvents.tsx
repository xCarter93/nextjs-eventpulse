"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getDaysUntilBirthday } from "@/utils/date";
import { Doc } from "../../../convex/_generated/dataModel";
import { MessageSquarePlus } from "lucide-react";

interface Birthday {
	name: string;
	date: Date;
	daysUntil: number;
}

export function UpcomingEvents() {
	const recipients = useQuery(api.recipients.getRecipients);

	if (!recipients) return null;

	// Process birthdays
	const upcomingBirthdays: Birthday[] = recipients
		.map((r: Doc<"recipients">) => {
			const date = new Date(r.birthday);
			return {
				name: r.name,
				date,
				daysUntil: getDaysUntilBirthday(date),
			};
		})
		.filter((event) => event.daysUntil >= 0 && event.daysUntil <= 30)
		.sort((a, b) => a.daysUntil - b.daysUntil);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Upcoming Birthdays</CardTitle>
			</CardHeader>
			<CardContent>
				{upcomingBirthdays.length > 0 ? (
					<div className="space-y-4">
						{upcomingBirthdays.map((event, index) => (
							<div
								key={`${event.name}-${index}`}
								className="flex items-center justify-between group"
							>
								<div>
									<div className="font-medium">{event.name}</div>
									<div className="text-sm text-muted-foreground">
										in {event.daysUntil} days
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="opacity-0 group-hover:opacity-100 transition-opacity"
									title="Configure birthday message"
								>
									<MessageSquarePlus className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				) : (
					<div className="text-sm text-muted-foreground">
						No upcoming birthdays in the next 30 days
					</div>
				)}
			</CardContent>
		</Card>
	);
}
