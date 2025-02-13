"use client";

import { ScheduledEmailsList } from "@/components/scheduled-emails/ScheduledEmailsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ScheduledEmailsContent() {
	return (
		<div className="container space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Scheduled Emails</h1>
				<p className="mt-2 text-muted-foreground">
					View and manage your scheduled emails, including automated birthday
					greetings and custom scheduled messages.
				</p>
			</div>
			<Tabs defaultValue="pending" className="space-y-4 email-status-tabs">
				<div className="flex items-center justify-between">
					<TabsList className="bg-secondary/20">
						<TabsTrigger
							value="pending"
							className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
						>
							Pending
						</TabsTrigger>
						<TabsTrigger
							value="completed"
							className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
						>
							Completed
						</TabsTrigger>
						<TabsTrigger
							value="canceled"
							className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
						>
							Canceled
						</TabsTrigger>
					</TabsList>
				</div>
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
	);
}
