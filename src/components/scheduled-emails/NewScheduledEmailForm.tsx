"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, forwardRef, useImperativeHandle } from "react";
import { steps } from "@/app/scheduled-emails/new/steps";
import Breadcrumbs from "@/app/scheduled-emails/new/Breadcrumbs";
import { scheduledEmailFormSchema } from "@/lib/validation";
import * as z from "zod";
import { EmailBuilder } from "@/components/scheduled-emails/EmailBuilder";
import { type EmailComponent } from "@/types/email-components";
import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";

interface NewScheduledEmailFormProps {
	onFormChange: (data: FormData) => void;
	initialDate?: Date;
}

type FormData = z.infer<typeof scheduledEmailFormSchema>;

export interface NewScheduledEmailFormRef {
	onFormChange: (data: Partial<FormData>) => void;
}

export const NewScheduledEmailForm = forwardRef<
	NewScheduledEmailFormRef,
	NewScheduledEmailFormProps
>(function NewScheduledEmailForm({ onFormChange, initialDate }, ref) {
	const scheduleEmail = useMutation(api.scheduledEmails.scheduleCustomEmail);
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	// Form state with required fields initialized
	const [formData, setFormData] = useState<FormData>({
		recipients: [],
		components: [],
		subject: "",
		scheduledDate: initialDate
			? new Date(
					initialDate.getTime() - initialDate.getTimezoneOffset() * 60000
				)
					.toISOString()
					.slice(0, 16)
			: "",
		colorScheme: {
			primary: "#3B82F6",
			secondary: "#60A5FA",
			accent: "#F59E0B",
			background: "#F3F4F6",
		},
	});

	// Get current step from URL or default to first step
	const currentStep = searchParams.get("step") || steps[0].key;

	// Calculate min and max dates for scheduling
	const minDate = new Date();
	minDate.setHours(0, 0, 0, 0);

	const maxDate = new Date();
	if (subscriptionLevel === "pro") {
		maxDate.setFullYear(maxDate.getFullYear() + 100); // Pro users can schedule 100 years ahead
	} else {
		maxDate.setDate(maxDate.getDate() + 7); // Free users can schedule 7 days ahead
	}

	// Update URL when step changes
	const setCurrentStep = (step: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("step", step);
		router.push(`?${params.toString()}`);
	};

	// Handle form changes from child components
	const handleFormChange = (data: Partial<FormData>) => {
		const newFormData = { ...formData, ...data };
		setFormData(newFormData as FormData);
		onFormChange(newFormData);
	};

	// Expose handleFormChange through ref
	useImperativeHandle(ref, () => ({
		onFormChange: handleFormChange,
	}));

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
						subject: validatedData.subject,
						components: validatedData.components,
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
		<div className="grid grid-cols-[40%_60%] gap-8">
			<div className="space-y-8">
				<Breadcrumbs
					currentStep={currentStep}
					setCurrentStep={setCurrentStep}
				/>

				<CurrentStepComponent
					defaultValues={formData}
					onFormChange={handleFormChange}
				/>

				<div className="flex justify-between">
					<Button
						variant="outline"
						onClick={() => {
							const currentIndex = steps.findIndex(
								(s) => s.key === currentStep
							);
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
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
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
			<div className="h-[calc(100vh-12rem)] sticky top-8">
				{currentStep === "color-scheme" ? (
					<EmailBuilder
						colorScheme={formData.colorScheme}
						components={formData.components}
						onComponentsChange={(components: EmailComponent[]) =>
							handleFormChange({ components })
						}
					/>
				) : (
					<Card className="h-full">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="p-3 rounded-lg bg-primary/10">
									<Mail className="w-5 h-5 text-primary" />
								</div>
								<h3 className="text-lg font-semibold">Email Preview</h3>
							</div>
						</CardHeader>
						<CardBody>
							<div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
								<div className="space-y-4 w-full max-w-md">
									<Skeleton className="h-8 w-3/4 mx-auto rounded-lg" />
									<Skeleton className="h-32 w-full rounded-lg" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-full rounded-lg" />
										<Skeleton className="h-4 w-5/6 rounded-lg" />
										<Skeleton className="h-4 w-4/6 rounded-lg" />
									</div>
								</div>
								<p className="text-muted-foreground text-center max-w-sm">
									Your email preview will appear here when you reach the
									&ldquo;What&rdquo; step
								</p>
							</div>
						</CardBody>
					</Card>
				)}
			</div>
		</div>
	);
});
