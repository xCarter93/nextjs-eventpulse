"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { recipientsSchema } from "@/lib/validation";
import * as z from "zod";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardBody, CardHeader } from "@heroui/react";

interface RecipientsFormProps {
	defaultValues?: z.infer<typeof recipientsSchema>;
	onFormChange: (data: Partial<z.infer<typeof recipientsSchema>>) => void;
}

export default function RecipientsForm({
	defaultValues,
	onFormChange,
}: RecipientsFormProps) {
	const recipients = useQuery(api.recipients.getRecipients);

	const form = useForm<z.infer<typeof recipientsSchema>>({
		resolver: zodResolver(recipientsSchema),
		defaultValues: defaultValues || {
			recipients: [],
		},
	});

	// Watch form fields for preview
	form.watch((value) => {
		onFormChange(value as Partial<z.infer<typeof recipientsSchema>>);
	});

	if (!recipients) {
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
			<Card>
				<CardHeader>
					<h2 className="text-lg font-semibold">Recipients</h2>
				</CardHeader>
				<CardBody>
					<form className="space-y-6">
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
											onChange={(values) =>
												onChange(values as Id<"recipients">[])
											}
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
					</form>
				</CardBody>
			</Card>
		</Form>
	);
}
