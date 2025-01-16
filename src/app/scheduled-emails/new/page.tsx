"use client";

import { NewScheduledEmailForm } from "@/components/scheduled-emails/NewScheduledEmailForm";
import { EmailPreview } from "@/components/scheduled-emails/EmailPreview";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

interface PreviewData {
	heading?: string;
	animationId?: string;
	body?: string;
}

const NewScheduledEmailPage = () => {
	const [preview, setPreview] = useState<PreviewData>({});
	const searchParams = useSearchParams();
	const dateParam = searchParams.get("date");

	return (
		<div className="container py-8">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						New Scheduled Email
					</h1>
					<p className="text-muted-foreground mt-2">
						Create a new scheduled email to send to your recipients.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<NewScheduledEmailForm
						onFormChange={setPreview}
						initialDate={dateParam ? new Date(parseInt(dateParam)) : undefined}
					/>
					<div className="h-fit rounded-lg border bg-card p-6">
						<h2 className="text-lg font-semibold mb-4">Email Preview</h2>
						<EmailPreview {...preview} />
					</div>
				</div>
			</div>
		</div>
	);
};

export default NewScheduledEmailPage;
