"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorSchemeSelector } from "@/components/animations/ColorSchemeSelector";

interface ColorSchemeFormProps {
	defaultValues?: z.infer<typeof colorSchemeSchema>;
	onFormChange: (data: Partial<z.infer<typeof colorSchemeSchema>>) => void;
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

	// Watch form fields for preview
	form.watch((value) => {
		onFormChange(value as Partial<z.infer<typeof colorSchemeSchema>>);
	});

	return (
		<Form {...form}>
			<form className="space-y-6">
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
			</form>
		</Form>
	);
}
