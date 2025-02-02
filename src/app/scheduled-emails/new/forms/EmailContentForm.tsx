"use client";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { emailContentSchema } from "@/lib/validation";
import * as z from "zod";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { canScheduleForDate } from "@/lib/permissions";

interface EmailContentFormProps {
	defaultValues?: z.infer<typeof emailContentSchema>;
	onFormChange: (data: Partial<z.infer<typeof emailContentSchema>>) => void;
}

export default function EmailContentForm({
	defaultValues,
	onFormChange,
}: EmailContentFormProps) {
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

	// Calculate min and max dates for scheduling
	const minDate = new Date();
	minDate.setHours(0, 0, 0, 0);

	const maxDate = new Date();
	if (subscriptionLevel === "pro") {
		maxDate.setFullYear(maxDate.getFullYear() + 100); // Pro users can schedule 100 years ahead
	} else {
		maxDate.setDate(maxDate.getDate() + 7); // Free users can schedule 7 days ahead
	}

	const form = useForm<z.infer<typeof emailContentSchema>>({
		resolver: zodResolver(emailContentSchema),
		defaultValues: defaultValues || {
			subject: "",
			scheduledDate: "",
			components: [],
		},
	});

	// Watch form fields for preview and validate date
	form.watch((value) => {
		if (value.scheduledDate) {
			const date = new Date(value.scheduledDate);
			if (!canScheduleForDate(date, subscriptionLevel ?? "free")) {
				form.setError("scheduledDate", {
					type: "manual",
					message:
						"Free users can only schedule emails up to 7 days in advance. Upgrade to Pro to schedule emails further ahead.",
				});
			} else {
				form.clearErrors("scheduledDate");
			}
		}
		console.log("Form state updated:", value);
		onFormChange(value as Partial<z.infer<typeof emailContentSchema>>);
	});

	return (
		<Form {...form}>
			<form className="space-y-6">
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
								<Input
									type="datetime-local"
									min={minDate.toISOString().slice(0, 16)}
									max={maxDate.toISOString().slice(0, 16)}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								{subscriptionLevel === "pro"
									? "Choose when to send the email."
									: "Free users can only schedule emails up to 7 days in advance."}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}
