import { getDaysUntilBirthday, isWithinDays } from "@/utils/date";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// This is a mock of what would come from your database
const mockRecipients = [
	{
		id: "1",
		name: "Alice Johnson",
		email: "alice@example.com",
		birthday: new Date(1990, 5, 15),
		userId: "user1",
	},
	{
		id: "2",
		name: "Bob Smith",
		email: "bob@example.com",
		birthday: new Date(1985, 7, 22),
		userId: "user1",
	},
];

export default function DashboardPage() {
	const upcomingBirthdays = mockRecipients
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
						<span className="font-medium">Recipients:</span>{" "}
						{mockRecipients.length}/5
					</div>
					<div className="text-sm text-muted-foreground">
						<span className="font-medium">Plan:</span> Free
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-card p-6 rounded-lg shadow-sm">
					<h2 className="text-lg font-semibold mb-4 text-card-foreground">
						Upcoming Birthdays
					</h2>
					{upcomingBirthdays.length > 0 ? (
						<div className="space-y-4">
							{upcomingBirthdays.map((recipient) => (
								<div
									key={recipient.id}
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
	);
}
