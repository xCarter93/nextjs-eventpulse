"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@heroui/react";
import { parseZonedDateTime } from "@internationalized/date";

const formSchema = z.object({
	name: z.string().min(2, {
		message: "Name must be at least 2 characters.",
	}),
	email: z.string().email({
		message: "Please enter a valid email address.",
	}),
	birthday: z.date({
		required_error: "Please select a date.",
	}),
});

type FormValues = z.infer<typeof formSchema>;

interface RecipientFormProps {
	recipient?: {
		_id: Id<"recipients">;
		name: string;
		email: string;
		birthday: number;
	};
	onSuccess: () => void;
}

export function RecipientForm({ recipient, onSuccess }: RecipientFormProps) {
	const addRecipient = useMutation(api.recipients.addRecipient);
	const updateRecipient = useMutation(api.recipients.updateRecipient);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: recipient
			? {
					name: recipient.name,
					email: recipient.email,
					birthday: new Date(recipient.birthday),
				}
			: {
					name: "",
					email: "",
				},
	});

	async function onSubmit(data: FormValues) {
		try {
			if (recipient) {
				await updateRecipient({
					id: recipient._id,
					name: data.name,
					email: data.email,
					birthday: data.birthday.getTime(),
				});
				toast.success("Recipient updated successfully");
			} else {
				await addRecipient({
					name: data.name,
					email: data.email,
					birthday: data.birthday.getTime(),
				});
				toast.success("Recipient added successfully");
			}
			onSuccess();
		} catch {
			toast.error(
				recipient ? "Failed to update recipient" : "Failed to add recipient"
			);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="John Doe" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="john@example.com"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="birthday"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<DatePicker
										disableAnimation
										showMonthAndYearPickers
										defaultValue={
											field.value
												? parseZonedDateTime(
														new Date(field.value).toISOString()
													)
												: null
										}
										onChange={(date) => {
											if (date) {
												field.onChange(date.toDate());
											} else {
												field.onChange(new Date());
											}
										}}
										label="Birth Date"
										variant="bordered"
										labelPlacement="outside"
										isInvalid={!!form.formState.errors.birthday}
										errorMessage={form.formState.errors.birthday?.message}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex justify-center space-x-3">
					<Button type="button" variant="outline" onClick={() => onSuccess()}>
						Cancel
					</Button>
					<Button type="submit">
						{recipient ? "Save Changes" : "Add Recipient"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
