"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Form, Input, Button, DatePicker } from "@heroui/react";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";

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

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
	} = useForm<FormValues>({
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

	const birthdayValue = watch("birthday");

	return (
		<Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<Input
				{...register("name")}
				label="Name"
				placeholder="John Doe"
				isRequired
				variant="bordered"
				labelPlacement="outside"
				isInvalid={!!errors.name}
				errorMessage={errors.name?.message}
			/>

			<Input
				{...register("email")}
				type="email"
				label="Email"
				placeholder="john@example.com"
				isRequired
				variant="bordered"
				labelPlacement="outside"
				isInvalid={!!errors.email}
				errorMessage={errors.email?.message}
			/>

			<DatePicker
				disableAnimation
				showMonthAndYearPickers
				value={
					birthdayValue
						? new CalendarDate(
								birthdayValue.getFullYear(),
								birthdayValue.getMonth() + 1,
								birthdayValue.getDate()
							)
						: null
				}
				onChange={(date) => {
					if (date) {
						const jsDate = date.toDate(getLocalTimeZone());
						setValue("birthday", jsDate, { shouldValidate: true });
					}
				}}
				label="Birth Date"
				variant="bordered"
				labelPlacement="outside"
				isRequired
				isInvalid={!!errors.birthday}
				errorMessage={errors.birthday?.message}
				popoverProps={{
					inert: false,
				}}
			/>

			<div className="flex justify-center space-x-3">
				<Button type="button" variant="bordered" onClick={() => onSuccess()}>
					Cancel
				</Button>
				<Button type="submit" color="primary">
					{recipient ? "Save Changes" : "Add Recipient"}
				</Button>
			</div>
		</Form>
	);
}
