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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { emailContentSchema } from "@/lib/validation";
import * as z from "zod";

interface EmailContentFormProps {
	defaultValues?: z.infer<typeof emailContentSchema>;
	onFormChange: (data: Partial<z.infer<typeof emailContentSchema>>) => void;
}

export default function EmailContentForm({
	defaultValues,
	onFormChange,
}: EmailContentFormProps) {
	const form = useForm<z.infer<typeof emailContentSchema>>({
		resolver: zodResolver(emailContentSchema),
		defaultValues: defaultValues || {
			subject: "",
			scheduledDate: "",
			heading: "",
			body: "",
		},
	});

	// Watch form fields for preview
	form.watch((value) => {
		onFormChange(value);
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
			</form>
		</Form>
	);
}
