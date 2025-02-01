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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { recipientsAnimationSchema } from "@/lib/validation";
import * as z from "zod";
import { Id } from "../../../../../convex/_generated/dataModel";

interface RecipientsAnimationFormProps {
	defaultValues?: z.infer<typeof recipientsAnimationSchema>;
	onFormChange: (
		data: Partial<z.infer<typeof recipientsAnimationSchema>>
	) => void;
}

export default function RecipientsAnimationForm({
	defaultValues,
	onFormChange,
}: RecipientsAnimationFormProps) {
	const recipients = useQuery(api.recipients.getRecipients);
	const animations = useQuery(api.animations.getUserAnimations);

	const form = useForm<z.infer<typeof recipientsAnimationSchema>>({
		resolver: zodResolver(recipientsAnimationSchema),
		defaultValues: defaultValues || {
			recipients: [],
			animationType: "uploaded",
			animation: "",
			animationUrl: "",
		},
	});

	// Watch form fields for preview
	form.watch((value) => {
		onFormChange(value as Partial<z.infer<typeof recipientsAnimationSchema>>);
	});

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
									onChange={(values) => onChange(values as Id<"recipients">[])}
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
					name="animationType"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Animation Type</FormLabel>
							<FormControl>
								<RadioGroup
									onValueChange={field.onChange}
									defaultValue={field.value}
									className="flex flex-col space-y-1"
								>
									<FormItem className="flex items-center space-x-3 space-y-0">
										<FormControl>
											<RadioGroupItem value="uploaded" />
										</FormControl>
										<FormLabel className="font-normal">
											Choose from uploaded images/animations
										</FormLabel>
									</FormItem>
									<FormItem className="flex items-center space-x-3 space-y-0">
										<FormControl>
											<RadioGroupItem value="url" />
										</FormControl>
										<FormLabel className="font-normal">
											Use custom GIF/image URL
										</FormLabel>
									</FormItem>
								</RadioGroup>
							</FormControl>
						</FormItem>
					)}
				/>

				{form.watch("animationType") === "uploaded" && (
					<FormField
						control={form.control}
						name="animation"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Animation</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select an image or animation" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{animations?.map((animation) => (
											<SelectItem key={animation._id} value={animation._id}>
												{animation.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>
									Choose an image or animation to include in the email.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{form.watch("animationType") === "url" && (
					<FormField
						control={form.control}
						name="animationUrl"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Image URL</FormLabel>
								<FormControl>
									<Input
										placeholder="Enter URL of a GIF, JPG, or PNG image..."
										{...field}
									/>
								</FormControl>
								<FormDescription>
									Enter the URL of a GIF from Giphy or any other image URL.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
			</form>
		</Form>
	);
}
