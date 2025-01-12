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
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";

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
	sendAutomaticEmail: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface RecipientFormProps {
	recipient?: {
		_id: Id<"recipients">;
		name: string;
		email: string;
		birthday: number;
		sendAutomaticEmail: boolean;
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
					sendAutomaticEmail: recipient.sendAutomaticEmail,
				}
			: {
					name: "",
					email: "",
					sendAutomaticEmail: false,
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
					sendAutomaticEmail: data.sendAutomaticEmail,
				});
				toast.success("Recipient updated successfully");
			} else {
				await addRecipient({
					name: data.name,
					email: data.email,
					birthday: data.birthday.getTime(),
					sendAutomaticEmail: data.sendAutomaticEmail,
				});
				toast.success("Recipient added successfully");
			}
			onSuccess();
		} catch (error) {
			toast.error(
				recipient ? "Failed to update recipient" : "Failed to add recipient"
			);
			console.error(error);
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

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="birthday"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Special Date</FormLabel>
									<FormControl>
										<DatePicker
											selected={field.value}
											onSelect={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="sendAutomaticEmail"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Settings</FormLabel>
									<div className="flex items-center h-10 space-x-2">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<FormLabel className="font-normal">
											Send Automatic Email
										</FormLabel>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
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
