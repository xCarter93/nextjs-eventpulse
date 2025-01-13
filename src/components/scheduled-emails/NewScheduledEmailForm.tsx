"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { MultiSelect } from "../ui/multi-select";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PreviewData {
	heading?: string;
	animationId?: string;
	body?: string;
}

interface NewScheduledEmailFormProps {
	onFormChange: (data: PreviewData) => void;
	initialDate?: Date;
}

const formSchema = z.object({
	recipients: z
		.array(z.string().transform((val) => val as Id<"recipients">))
		.min(1, "Select at least one recipient"),
	animation: z.string().min(1, "Select an animation"),
	subject: z.string().min(1, "Enter a subject"),
	scheduledDate: z.string().min(1, "Select a date"),
	heading: z.string().min(1, "Enter a heading"),
	body: z.string().min(1, "Enter a message"),
});

export function NewScheduledEmailForm({
	onFormChange,
	initialDate,
}: NewScheduledEmailFormProps) {
	const recipients = useQuery(api.recipients.getRecipients);
	const animations = useQuery(api.animations.getBaseAnimations);
	const scheduleEmail = useMutation(api.scheduledEmails.scheduleCustomEmail);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			recipients: [],
			animation: "",
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
		},
	});

	// Watch form fields for preview
	useEffect(() => {
		const subscription = form.watch((value) => {
			onFormChange({
				heading: value.heading,
				animationId: value.animation,
				body: value.body,
			});
		});
		return () => subscription.unsubscribe();
	}, [form, onFormChange]);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsSubmitting(true);
		try {
			// Schedule an email for each recipient
			await Promise.all(
				values.recipients.map(async (recipientId) => {
					await scheduleEmail({
						recipientId,
						scheduledDate: new Date(values.scheduledDate).getTime(),
						message: values.body,
						subject: values.subject,
					});
				})
			);

			toast.success("Emails scheduled successfully");
			router.push("/scheduled-emails");
		} catch (error) {
			console.error("Failed to schedule emails:", error);
			toast.error("Failed to schedule emails");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (!recipients || !animations) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const recipientOptions = recipients.map((recipient) => ({
		label: `${recipient.name} (${recipient.email})`,
		value: recipient._id,
	}));

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="recipients"
					render={({ field: { onChange, ...field } }) => (
						<FormItem>
							<FormLabel>Recipients</FormLabel>
							<FormControl>
								<MultiSelect
									options={recipientOptions}
									selected={Array.isArray(field.value) ? field.value : []}
									onChange={onChange}
									placeholder="Select recipients..."
								/>
							</FormControl>
							<FormDescription>
								Select one or more recipients for this email.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="animation"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Animation</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select an animation" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{animations.map((animation: Doc<"animations">) => (
										<SelectItem
											key={animation._id}
											value={animation.storageId as string}
										>
											{animation.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>
								Choose an animation to include in the email.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="subject"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Subject</FormLabel>
							<FormControl>
								<Input placeholder="Enter email subject..." {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="scheduledDate"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Send Date</FormLabel>
							<FormControl>
								<Input type="datetime-local" {...field} />
							</FormControl>
							<FormDescription>Choose when to send the email.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="heading"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email Heading</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter heading to display above animation..."
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="body"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email Message</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Enter message to display below animation..."
									className="min-h-[100px]"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Schedule Email
				</Button>
			</form>
		</Form>
	);
}
