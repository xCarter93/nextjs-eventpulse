import { Metadata } from "next";
import { ScheduledEmailsContent } from "@/components/scheduled-emails/ScheduledEmailsContent";

export const metadata: Metadata = {
	title: "Scheduled Emails | EventPulse",
	description: "Manage your scheduled emails and automated birthday greetings.",
};

export default function ScheduledEmailsPage() {
	return <ScheduledEmailsContent />;
}
