import { Metadata } from "next";
import { ScheduledEmailsList } from "@/components/scheduled-emails/ScheduledEmailsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
	title: "Scheduled Emails | AnimGreet",
	description: "Manage your scheduled emails and automated birthday greetings.",
};

export default function ScheduledEmailsPage() {
	return (
		<div className="container py-8">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Scheduled Emails
					</h1>
					<p className="text-muted-foreground mt-2">
						View and manage your scheduled emails, including automated birthday
						greetings and custom scheduled messages.
					</p>
				</div>
				<Tabs defaultValue="pending">
					<TabsList>
						<TabsTrigger value="pending">Pending</TabsTrigger>
						<TabsTrigger value="completed">Completed</TabsTrigger>
						<TabsTrigger value="canceled">Canceled</TabsTrigger>
					</TabsList>
					<TabsContent value="pending">
						<ScheduledEmailsList filterStatus="pending" />
					</TabsContent>
					<TabsContent value="completed">
						<ScheduledEmailsList filterStatus="completed" />
					</TabsContent>
					<TabsContent value="canceled">
						<ScheduledEmailsList filterStatus="canceled" />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
