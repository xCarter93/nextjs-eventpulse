"use client";

import {
	NewScheduledEmailForm,
	type NewScheduledEmailFormRef,
} from "@/components/scheduled-emails/NewScheduledEmailForm";
import { HelpDrawer } from "@/components/scheduled-emails/HelpDrawer";
import { useRef } from "react";
import { useSearchParams } from "next/navigation";

const NewScheduledEmailPage = () => {
	const formRef = useRef<NewScheduledEmailFormRef>(null);
	const searchParams = useSearchParams();
	const dateParam = searchParams.get("date");

	const handleFormChange = () => {
		// Form data is now handled internally by NewScheduledEmailForm
	};

	return (
		<div className="container py-4">
			<div className="flex flex-col gap-6">
				<div className="fixed top-24 right-4 md:right-8 z-50">
					<HelpDrawer />
				</div>
				<NewScheduledEmailForm
					ref={formRef}
					onFormChange={handleFormChange}
					initialDate={dateParam ? new Date(parseInt(dateParam)) : undefined}
				/>
			</div>
		</div>
	);
};

export default NewScheduledEmailPage;
