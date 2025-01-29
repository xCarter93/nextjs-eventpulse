"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useEffect } from "react";

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { AddressAutofillForm } from "@/components/address-autofill/AddressAutofillForm";
import { RecipientAddressData } from "@/app/settings/types";

const formatPhoneNumber = (value: string) => {
	// Remove all non-digits
	const digits = value.replace(/\D/g, "");

	// Format the number as user types
	if (digits.length <= 3) {
		return `(${digits}`;
	} else if (digits.length <= 6) {
		return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
	} else if (digits.length <= 10) {
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	}
	// Limit to 10 digits
	return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const addressSchema = z.object({
	line1: z.string().optional(),
	line2: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	postalCode: z.string().optional(),
	country: z.string().optional(),
	coordinates: z
		.object({
			latitude: z.number(),
			longitude: z.number(),
		})
		.optional(),
});

const formSchema = z.object({
	relation: z.enum(["friend", "parent", "spouse", "sibling"]).optional(),
	anniversaryDate: z.date().optional(),
	notes: z.string().optional(),
	nickname: z.string().optional(),
	phoneNumber: z.string().optional(),
	address: addressSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface RecipientMetadataFormProps {
	recipient: {
		_id: Id<"recipients">;
		metadata?: {
			relation?: "friend" | "parent" | "spouse" | "sibling";
			anniversaryDate?: number;
			notes?: string;
			nickname?: string;
			phoneNumber?: string;
			address?: RecipientAddressData;
		};
	};
}

export function RecipientMetadataForm({
	recipient,
}: RecipientMetadataFormProps) {
	const updateRecipientMetadata = useMutation(
		api.recipients.updateRecipientMetadata
	);
	const subscription = useQuery(api.subscriptions.getUserSubscription);
	const isSubscriptionActive =
		subscription && new Date(subscription.stripeCurrentPeriodEnd) > new Date();

	const defaultAddress: RecipientAddressData = {
		line1: recipient.metadata?.address?.line1 || undefined,
		line2: recipient.metadata?.address?.line2 || undefined,
		city: recipient.metadata?.address?.city || undefined,
		state: recipient.metadata?.address?.state || undefined,
		postalCode: recipient.metadata?.address?.postalCode || undefined,
		country: recipient.metadata?.address?.country || undefined,
		coordinates: recipient.metadata?.address?.coordinates || undefined,
	};

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			relation: recipient.metadata?.relation,
			anniversaryDate: recipient.metadata?.anniversaryDate
				? new Date(recipient.metadata.anniversaryDate)
				: undefined,
			notes: recipient.metadata?.notes || "",
			nickname: recipient.metadata?.nickname || "",
			phoneNumber: recipient.metadata?.phoneNumber || "",
			address: defaultAddress,
		},
	});

	// Update form when recipient metadata changes
	useEffect(() => {
		form.reset({
			relation: recipient.metadata?.relation,
			anniversaryDate: recipient.metadata?.anniversaryDate
				? new Date(recipient.metadata.anniversaryDate)
				: undefined,
			notes: recipient.metadata?.notes || "",
			nickname: recipient.metadata?.nickname || "",
			phoneNumber: recipient.metadata?.phoneNumber || "",
			address: {
				line1: recipient.metadata?.address?.line1 || undefined,
				line2: recipient.metadata?.address?.line2 || undefined,
				city: recipient.metadata?.address?.city || undefined,
				state: recipient.metadata?.address?.state || undefined,
				postalCode: recipient.metadata?.address?.postalCode || undefined,
				country: recipient.metadata?.address?.country || undefined,
				coordinates: recipient.metadata?.address?.coordinates || undefined,
			},
		});
	}, [form, recipient.metadata]);

	const relation = form.watch("relation");

	async function onSubmit(data: FormValues) {
		try {
			await updateRecipientMetadata({
				id: recipient._id,
				metadata: {
					relation: data.relation,
					anniversaryDate: data.anniversaryDate?.getTime(),
					notes: data.notes,
					nickname: data.nickname,
					phoneNumber: data.phoneNumber,
					...(isSubscriptionActive ? { address: data.address } : {}),
				},
			});
			toast.success("Recipient metadata updated successfully");
		} catch {
			toast.error("Failed to update recipient metadata");
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="grid grid-cols-2 gap-6">
					<FormField
						control={form.control}
						name="relation"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Relationship</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select relationship" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="friend">Friend</SelectItem>
										<SelectItem value="parent">Parent</SelectItem>
										<SelectItem value="spouse">Spouse</SelectItem>
										<SelectItem value="sibling">Sibling</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{relation === "spouse" && (
						<FormField
							control={form.control}
							name="anniversaryDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Anniversary Date</FormLabel>
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
					)}

					<FormField
						control={form.control}
						name="nickname"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nickname</FormLabel>
								<FormControl>
									<Input placeholder="Enter nickname" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="phoneNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Phone Number</FormLabel>
								<FormControl>
									<Input
										placeholder="(555) 555-5555"
										{...field}
										value={field.value ? formatPhoneNumber(field.value) : ""}
										onChange={(e) => {
											// Store only digits in the form state
											const digits = e.target.value.replace(/\D/g, "");
											field.onChange(digits);
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="space-y-4">
					<h3 className="font-medium">Address Information</h3>
					{isSubscriptionActive ? (
						<AddressAutofillForm
							form={form}
							onAddressChange={(address) => {
								form.setValue("address", address as RecipientAddressData);
							}}
							isRecipientForm={true}
						/>
					) : (
						<LockedFeature featureDescription="add recipient addresses and view them on a map">
							<AddressAutofillForm
								form={form}
								onAddressChange={(address) => {
									form.setValue("address", address as RecipientAddressData);
								}}
								isRecipientForm={true}
							/>
						</LockedFeature>
					)}
				</div>

				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Notes</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Add any additional notes"
									className="min-h-[100px]"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end">
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		</Form>
	);
}
