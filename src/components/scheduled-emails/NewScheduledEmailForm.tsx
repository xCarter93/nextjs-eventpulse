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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type ColorScheme } from "@/types";
import { ColorSchemeSelector } from "@/components/animations/ColorSchemeSelector";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PreviewData {
	heading?: string;
	animationId?: string;
	animationUrl?: string;
	body?: string;
	colorScheme?: ColorScheme;
}

interface NewScheduledEmailFormProps {
	onFormChange: (data: PreviewData) => void;
	initialDate?: Date;
}

const defaultColorScheme: ColorScheme = {
	primary: "#3B82F6",
	secondary: "#60A5FA",
	accent: "#F59E0B",
	background: "#F3F4F6",
};

const formSchema = z
	.object({
		recipients: z
			.array(z.string().transform((val) => val as Id<"recipients">))
			.min(1, "Select at least one recipient"),
		animationType: z.enum(["uploaded", "url"]),
		animation: z.string().optional(),
		animationUrl: z.string().optional(),
		subject: z.string().min(1, "Enter a subject"),
		scheduledDate: z.string().min(1, "Select a date"),
		heading: z.string().min(1, "Enter a heading"),
		body: z.string().min(1, "Enter a message"),
		colorScheme: z.object({
			primary: z.string(),
			secondary: z.string(),
			accent: z.string(),
			background: z.string(),
		}),
	})
	.refine(
		(data) => {
			if (data.animationType === "uploaded") {
				return !!data.animation;
			} else {
				return (
					!!data.animationUrl && data.animationUrl.match(/\.(gif|jpe?g|png)$/i)
				);
			}
		},
		{
			message: "Please select an animation or enter a valid image URL",
			path: ["animation"],
		}
	);

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
			colorScheme: defaultColorScheme,
		},
	});

	// Watch form fields for preview
	useEffect(() => {
		const subscription = form.watch((value) => {
			let previewAnimationId;
			if (value.animationType === "uploaded") {
				const selectedAnimation = animations?.find(
					(a) => a._id === value.animation
				);
				previewAnimationId = selectedAnimation?.storageId;
			}

			const colorScheme: ColorScheme = {
				primary: value.colorScheme?.primary ?? defaultColorScheme.primary,
				secondary: value.colorScheme?.secondary ?? defaultColorScheme.secondary,
				accent: value.colorScheme?.accent ?? defaultColorScheme.accent,
				background:
					value.colorScheme?.background ?? defaultColorScheme.background,
			};

			onFormChange({
				heading: value.heading,
				animationId: previewAnimationId,
				animationUrl:
					value.animationType === "url" ? value.animationUrl : undefined,
				body: value.body,
				colorScheme,
			});
		});
		return () => subscription.unsubscribe();
	}, [form, onFormChange, animations]);

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
						animationId:
							values.animationType === "uploaded"
								? (values.animation as Id<"animations">)
								: undefined,
						animationUrl:
							values.animationType === "url" ? values.animationUrl : undefined,
						colorScheme: values.colorScheme,
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
										{animations?.map((animation: Doc<"animations">) => (
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

				<Card>
					<CardHeader>
						<CardTitle>Color Scheme</CardTitle>
					</CardHeader>
					<CardContent>
						<FormField
							control={form.control}
							name="colorScheme"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<ColorSchemeSelector
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription>
										Customize the colors of your email.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Schedule Email
				</Button>
			</form>
		</Form>
	);
}
