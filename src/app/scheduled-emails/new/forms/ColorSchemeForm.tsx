"use client";

import { EmailTemplateGrid } from "@/components/scheduled-emails/EmailTemplateCard";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { colorSchemeSchema } from "@/lib/validation";
import * as z from "zod";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ColorSchemeSelector } from "@/components/animations/ColorSchemeSelector";
import { type EmailComponent } from "@/types/email-components";
import { useEffect } from "react";

interface ColorSchemeFormProps {
	defaultValues?: z.infer<typeof colorSchemeSchema>;
	onFormChange: (
		data: Partial<z.infer<typeof colorSchemeSchema>> & {
			components?: EmailComponent[];
		}
	) => void;
}

const defaultColorScheme = {
	primary: "#3B82F6",
	secondary: "#60A5FA",
	accent: "#F59E0B",
	background: "#F3F4F6",
};

export default function ColorSchemeForm({
	defaultValues,
	onFormChange,
}: ColorSchemeFormProps) {
	const form = useForm<z.infer<typeof colorSchemeSchema>>({
		resolver: zodResolver(colorSchemeSchema),
		defaultValues: defaultValues || {
			colorScheme: defaultColorScheme,
		},
	});

	// Watch color scheme changes only
	useEffect(() => {
		const subscription = form.watch((value) => {
			const colorScheme = value.colorScheme;
			if (colorScheme) {
				onFormChange({
					colorScheme: {
						primary: colorScheme.primary || defaultColorScheme.primary,
						secondary: colorScheme.secondary || defaultColorScheme.secondary,
						accent: colorScheme.accent || defaultColorScheme.accent,
						background: colorScheme.background || defaultColorScheme.background,
					},
				});
			}
		});
		return () => subscription.unsubscribe();
	}, [form, onFormChange]);

	const handleTemplateSelect = (components: EmailComponent[]) => {
		const colorScheme = form.getValues("colorScheme");
		const formData = {
			colorScheme: {
				primary: colorScheme.primary || defaultColorScheme.primary,
				secondary: colorScheme.secondary || defaultColorScheme.secondary,
				accent: colorScheme.accent || defaultColorScheme.accent,
				background: colorScheme.background || defaultColorScheme.background,
			},
			components: components,
		};
		onFormChange(formData);
	};

	return (
		<Form {...form}>
			<form className="space-y-6">
				{/* Template Selection Card */}
				<Card>
					<CardHeader>
						<h2 className="text-lg font-semibold">Email Template</h2>
					</CardHeader>
					<CardBody>
						<EmailTemplateGrid onSelect={handleTemplateSelect} />
					</CardBody>
				</Card>

				{/* Color Scheme Card */}
				<Card>
					<CardHeader>
						<h2 className="text-lg font-semibold">Color Scheme</h2>
					</CardHeader>
					<CardBody>
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
					</CardBody>
				</Card>
			</form>
		</Form>
	);
}
