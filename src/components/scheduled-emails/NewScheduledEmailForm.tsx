"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { steps } from "@/app/scheduled-emails/new/steps";
import Breadcrumbs from "@/app/scheduled-emails/new/Breadcrumbs";
import { scheduledEmailFormSchema } from "@/lib/validation";
import * as z from "zod";
import { Id } from "../../../convex/_generated/dataModel";

interface PreviewData {
	heading?: string;
	animationId?: string;
	animationUrl?: string;
	body?: string;
	colorScheme?: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
	};
}

interface NewScheduledEmailFormProps {
	onFormChange: (data: PreviewData) => void;
	initialDate?: Date;
}

type FormData = z.infer<typeof scheduledEmailFormSchema>;

export function NewScheduledEmailForm({
	onFormChange,
	initialDate,
}: NewScheduledEmailFormProps) {
	const scheduleEmail = useMutation(api.scheduledEmails.scheduleCustomEmail);
	const animations = useQuery(api.animations.getBaseAnimations);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	// Form state with required fields initialized
	const [formData, setFormData] = useState<FormData>({
		recipients: [],
		animationType: "uploaded",
		animation: "",
		animationUrl: "",
		subject: "",
		scheduledDate: initialDate
			? new Date(
					initialDate.getTime() - initialDate.getTimezoneOffset() * 60000
				)
					.toISOString()
					.slice(0, 16)
			: "",
		heading: "",
		body: "",
		colorScheme: {
			primary: "#3B82F6",
			secondary: "#60A5FA",
			accent: "#F59E0B",
			background: "#F3F4F6",
		},
	});

	// Get current step from URL or default to first step
	const currentStep = searchParams.get("step") || steps[0].key;

	// Update URL when step changes
	const setCurrentStep = (step: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("step", step);
		router.push(`?${params.toString()}`);
	};

	// Handle form changes from child components
	const handleFormChange = (data: Partial<FormData>) => {
		const newFormData = { ...formData, ...data };
		setFormData(newFormData as FormData); // Cast is safe because we initialized with all required fields

		// Update preview
		const selectedAnimation = animations?.find(
			(a) => a._id === newFormData.animation
		);

		onFormChange({
			heading: newFormData.heading,
			animationId: selectedAnimation?.storageId,
			animationUrl:
				newFormData.animationType === "url"
					? newFormData.animationUrl
					: undefined,
			body: newFormData.body,
			colorScheme: newFormData.colorScheme,
		});
	};

	// Handle form submission
	async function handleSubmit() {
		try {
			setIsSubmitting(true);

			// Validate entire form data
			const validatedData = scheduledEmailFormSchema.parse(formData);

			// Schedule an email for each recipient
			await Promise.all(
				validatedData.recipients.map(async (recipientId) => {
					await scheduleEmail({
						recipientId,
						scheduledDate: new Date(validatedData.scheduledDate).getTime(),
						message: validatedData.body,
						subject: validatedData.subject,
						animationId:
							validatedData.animationType === "uploaded"
								? (validatedData.animation as Id<"animations">)
								: undefined,
						animationUrl:
							validatedData.animationType === "url"
								? validatedData.animationUrl
								: undefined,
						colorScheme: validatedData.colorScheme,
					});
				})
			);

			toast.success("Emails scheduled successfully");
			router.push("/scheduled-emails");
		} catch (error) {
			console.error("Failed to schedule emails:", error);
			if (error instanceof z.ZodError) {
				// If validation fails, show error and navigate to the appropriate step
				const firstError = error.errors[0];
				const errorPath = firstError.path[0] as string;

				// Find which step contains the error
				const stepWithError = steps.find((step) => {
					const fields = Object.keys(formData);
					const stepFields = fields.filter((field) => {
						const fieldLower = field.toLowerCase();
						const stepNameLower = step.key.toLowerCase();
						return (
							field === errorPath ||
							fieldLower.includes(stepNameLower) ||
							stepNameLower.includes(fieldLower)
						);
					});
					return stepFields.length > 0;
				});

				if (stepWithError) {
					setCurrentStep(stepWithError.key);
					toast.error(firstError.message);
				} else {
					toast.error("Please fill in all required fields");
				}
			} else {
				toast.error("Failed to schedule emails");
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	// Get current step component
	const CurrentStepComponent = steps.find(
		(s) => s.key === currentStep
	)?.component;

	if (!CurrentStepComponent) {
		return null;
	}

	return (
		<div className="space-y-8">
			<Breadcrumbs currentStep={currentStep} setCurrentStep={setCurrentStep} />

			<CurrentStepComponent
				defaultValues={formData}
				onFormChange={handleFormChange}
			/>

			<div className="flex justify-between">
				<Button
					variant="outline"
					onClick={() => {
						const currentIndex = steps.findIndex((s) => s.key === currentStep);
						if (currentIndex > 0) {
							setCurrentStep(steps[currentIndex - 1].key);
						}
					}}
					disabled={currentStep === steps[0].key}
				>
					Previous
				</Button>

				{currentStep === steps[steps.length - 1].key ? (
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Schedule Email
					</Button>
				) : (
					<Button
						onClick={() => {
							const currentIndex = steps.findIndex(
								(s) => s.key === currentStep
							);
							if (currentIndex < steps.length - 1) {
								setCurrentStep(steps[currentIndex + 1].key);
							}
						}}
					>
						Next
					</Button>
				)}
			</div>
		</div>
	);
}
