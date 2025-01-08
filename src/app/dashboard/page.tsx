"use client";

import { getDaysUntilBirthday, isWithinDays } from "@/utils/date";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Calendar from "@/components/dashboard/Calendar";
import { getPublicHolidays } from "@/app/actions/holidays";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";

interface Holiday {
	date: string;
	name: string;
	localName: string;
	type: string;
}

export default function DashboardPage() {
	const { userId } = useAuth();
	const [tokenIdentifier, setTokenIdentifier] = useState<string>("");
	const [holidays, setHolidays] = useState<Holiday[]>([]);

	useEffect(() => {
		if (userId) {
			setTokenIdentifier(
				`https://${process.env.NEXT_PUBLIC_CLERK_HOSTNAME}|${userId}`
			);
		}
	}, [userId]);

	useEffect(() => {
		const fetchHolidays = async () => {
			const currentYear = new Date().getFullYear();
			const holidaysData = await getPublicHolidays(currentYear, "US");
			setHolidays(holidaysData);
		};
		fetchHolidays();
	}, []);

	const recipients =
		useQuery(
			api.recipients.getRecipients,
			tokenIdentifier ? { tokenIdentifier } : "skip"
		) || [];

	const user = useQuery(
		api.users.getUser,
		tokenIdentifier ? { tokenIdentifier } : "skip"
	);

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
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
				<div className="flex space-x-4">
					<div className="text-sm text-muted-foreground">
						<span className="font-medium">Recipients:</span> {recipients.length}
						/{user?.subscription.features.maxRecipients ?? "-"}
					</div>
					<div className="text-sm text-muted-foreground">
						<span className="font-medium">Plan:</span>{" "}
						{user?.subscription.tier === "pro" ? "Pro" : "Free"}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<Calendar
						birthdays={recipientsWithDate.map((r) => ({
							date: r.birthday,
							name: r.name,
						}))}
						holidays={holidays}
						className="shadow-sm"
					/>
				</div>

				<div className="space-y-6">
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
											<p className="font-medium text-foreground">
												{recipient.name}
											</p>
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

					<div className="bg-card p-6 rounded-lg shadow-sm">
						<h2 className="text-lg font-semibold mb-4 text-card-foreground">
							Quick Actions
						</h2>
						<div className="grid grid-cols-2 gap-4">
							<Link
								href="/recipients/new"
								className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
							>
								<span className="text-xl mb-2">👥</span>
								<span className="text-sm font-medium text-foreground">
									Add Recipient
								</span>
							</Link>
							<Link
								href="/animations/new"
								className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
							>
								<span className="text-xl mb-2">✨</span>
								<span className="text-sm font-medium text-foreground">
									Create Animation
								</span>
							</Link>
							<Link
								href="/settings"
								className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
							>
								<span className="text-xl mb-2">⚙️</span>
								<span className="text-sm font-medium text-foreground">
									Settings
								</span>
							</Link>
							<Link
								href="/upgrade"
								className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
							>
								<span className="text-xl mb-2">⭐</span>
								<span className="text-sm font-medium text-foreground">
									Upgrade Plan
								</span>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
