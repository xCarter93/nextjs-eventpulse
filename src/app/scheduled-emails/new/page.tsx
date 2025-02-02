"use client";

import {
	NewScheduledEmailForm,
	type NewScheduledEmailFormRef,
} from "@/components/scheduled-emails/NewScheduledEmailForm";
import { EmailBuilder } from "@/components/scheduled-emails/EmailBuilder";
import { HelpDrawer } from "@/components/scheduled-emails/HelpDrawer";
import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { type EmailComponent } from "@/types/email-components";
import { scheduledEmailFormSchema } from "@/lib/validation";
import * as z from "zod";

type FormData = z.infer<typeof scheduledEmailFormSchema>;

const NewScheduledEmailPage = () => {
	const [preview, setPreview] = useState<FormData>({
		recipients: [],
		components: [],
		subject: "",
		scheduledDate: "",
		colorScheme: {
			primary: "#3B82F6",
			secondary: "#60A5FA",
			accent: "#F59E0B",
			background: "#F3F4F6",
		},
	});
	const formRef = useRef<NewScheduledEmailFormRef>(null);
	const searchParams = useSearchParams();
	const dateParam = searchParams.get("date");

	const handleComponentsChange = (components: EmailComponent[]) => {
		// Update preview state
		setPreview((prev) => ({ ...prev, components }));
		// Update form state
		formRef.current?.onFormChange({ components });
	};

	return (
		<div className="container py-4">
			<div className="flex flex-col gap-6">
				<div className="fixed top-24 right-4 md:right-8 z-50">
					<HelpDrawer />
				</div>
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<NewScheduledEmailForm
						ref={formRef}
						onFormChange={setPreview}
						initialDate={dateParam ? new Date(parseInt(dateParam)) : undefined}
					/>
					<EmailBuilder
						components={preview.components}
						colorScheme={preview.colorScheme}
						onComponentsChange={handleComponentsChange}
					/>
				</div>
			</div>
		</div>
	);
};

export default NewScheduledEmailPage;
