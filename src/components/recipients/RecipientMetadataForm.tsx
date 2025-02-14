"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useEffect } from "react";
import {
	Button,
	Input,
	Select,
	SelectItem,
	Textarea,
	Form,
	Card,
	CardHeader,
	CardBody,
} from "@heroui/react";
import { DatePicker } from "@heroui/react";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { AddressAutofillForm } from "@/components/address-autofill/AddressAutofillForm";
import { RecipientAddressData } from "@/app/settings/types";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";

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
	email: z.string().email({
		message: "Please enter a valid email address.",
	}),
	birthday: z.date({
		required_error: "Please select a date.",
	}),
	relation: z.enum(["friend", "parent", "spouse", "sibling"]).optional(),
	anniversaryDate: z.date().optional(),
	notes: z.string().default(""),
	nickname: z.string().default(""),
	phoneNumber: z.string().default(""),
	address: addressSchema,
});

type FormValues = z.infer<typeof formSchema>;

// Create a separate form for address fields to match AddressAutofillForm's expected type
type AddressFormFields = {
	address: RecipientAddressData;
};

interface RecipientMetadataFormProps {
	recipient: {
		_id: Id<"recipients">;
		name: string;
		email: string;
		birthday: number;
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
	const updateRecipient = useMutation(api.recipients.updateRecipient);
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
			email: recipient.email,
			birthday: new Date(recipient.birthday),
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

	// Create a separate form for address fields
	const addressForm = useForm<AddressFormFields>({
		defaultValues: {
			address: defaultAddress,
		},
	});

	const {
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
		reset,
	} = form;

	// Update form when recipient metadata changes
	useEffect(() => {
		reset({
			email: recipient.email,
			birthday: new Date(recipient.birthday),
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

		// Also reset the address form
		addressForm.reset({
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
	}, [reset, recipient, addressForm]);

	const relation = watch("relation");
	const anniversaryDate = watch("anniversaryDate");
	const birthday = watch("birthday");

	async function onSubmit(data: FormValues) {
		try {
			// Update basic recipient info
			await updateRecipient({
				id: recipient._id,
				name: recipient.name,
				email: data.email,
				birthday: data.birthday.getTime(),
			});

			// Update metadata
			await updateRecipientMetadata({
				id: recipient._id,
				metadata: {
					relation: data.relation,
					anniversaryDate: data.anniversaryDate?.getTime(),
					notes: data.notes,
					nickname: data.nickname,
					phoneNumber: data.phoneNumber,
					...(isSubscriptionActive
						? { address: addressForm.getValues().address }
						: {}),
				},
			});
			toast.success("Recipient updated successfully");
		} catch {
			toast.error("Failed to update recipient");
		}
	}

	return (
		<Form
			onSubmit={handleSubmit(onSubmit)}
			className="w-full"
			validationBehavior="aria"
		>
			<div className="space-y-4">
				<Card className="w-full">
					<CardHeader>
						<h3 className="text-lg font-semibold">Contact Information</h3>
					</CardHeader>
					<CardBody>
						<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="w-full">
								<Input
									value={watch("email") || ""}
									onChange={(e) => setValue("email", e.target.value)}
									label="Email"
									placeholder="john@example.com"
									type="email"
									isInvalid={!!errors.email}
									errorMessage={errors.email?.message}
									variant="bordered"
									labelPlacement="outside"
									isRequired
									className="w-full"
								/>
							</div>

							<div className="w-full">
								<Input
									label="Phone Number"
									placeholder="(555) 555-5555"
									value={
										watch("phoneNumber")
											? formatPhoneNumber(watch("phoneNumber"))
											: ""
									}
									onChange={(e) => {
										const digits = e.target.value.replace(/\D/g, "");
										setValue("phoneNumber", digits);
									}}
									isInvalid={!!errors.phoneNumber}
									errorMessage={errors.phoneNumber?.message}
									variant="bordered"
									labelPlacement="outside"
									description="Optional: Add a phone number"
									pattern="[\d\(\)\-\s]+"
									className="w-full"
								/>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className="w-full">
					<CardHeader>
						<h3 className="text-lg font-semibold">Personal Details</h3>
					</CardHeader>
					<CardBody>
						<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="w-full">
								<DatePicker
									label="Birthday"
									value={
										birthday
											? new CalendarDate(
													birthday.getFullYear(),
													birthday.getMonth() + 1,
													birthday.getDate()
												)
											: null
									}
									onChange={(date) => {
										if (date) {
											const jsDate = date.toDate(getLocalTimeZone());
											setValue("birthday", jsDate);
										}
									}}
									isInvalid={!!errors.birthday}
									errorMessage={errors.birthday?.message}
									variant="bordered"
									labelPlacement="outside"
									isRequired
									className="w-full"
								/>
							</div>

							<div className="w-full">
								<Select
									label="Relationship"
									selectedKeys={relation ? [relation] : []}
									onChange={(e) => {
										const value = e.target.value as
											| "friend"
											| "parent"
											| "spouse"
											| "sibling";
										setValue("relation", value);
									}}
									isInvalid={!!errors.relation}
									errorMessage={errors.relation?.message}
									variant="bordered"
									labelPlacement="outside"
									isRequired
									className="w-full"
								>
									<SelectItem key="friend" value="friend">
										Friend
									</SelectItem>
									<SelectItem key="parent" value="parent">
										Parent
									</SelectItem>
									<SelectItem key="spouse" value="spouse">
										Spouse
									</SelectItem>
									<SelectItem key="sibling" value="sibling">
										Sibling
									</SelectItem>
								</Select>
							</div>

							{relation === "spouse" && (
								<div className="w-full">
									<DatePicker
										label="Anniversary Date"
										value={
											anniversaryDate
												? new CalendarDate(
														anniversaryDate.getFullYear(),
														anniversaryDate.getMonth() + 1,
														anniversaryDate.getDate()
													)
												: null
										}
										onChange={(date) => {
											if (date) {
												const jsDate = date.toDate(getLocalTimeZone());
												setValue("anniversaryDate", jsDate);
											}
										}}
										isInvalid={!!errors.anniversaryDate}
										errorMessage={errors.anniversaryDate?.message}
										variant="bordered"
										labelPlacement="outside"
										isRequired={relation === "spouse"}
										className="w-full"
									/>
								</div>
							)}

							<div className="w-full">
								<Input
									value={watch("nickname") || ""}
									onChange={(e) => setValue("nickname", e.target.value)}
									label="Nickname"
									placeholder="Enter nickname"
									isInvalid={!!errors.nickname}
									errorMessage={errors.nickname?.message}
									variant="bordered"
									labelPlacement="outside"
									description="Optional: Add a nickname for this recipient"
									className="w-full"
								/>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card className="w-full">
					<CardHeader>
						<h3 className="text-lg font-semibold">Address Information</h3>
					</CardHeader>
					<CardBody>
						{isSubscriptionActive ? (
							<AddressAutofillForm
								form={addressForm}
								onAddressChange={(address) => {
									setValue("address", address as RecipientAddressData);
									addressForm.setValue(
										"address",
										address as RecipientAddressData
									);
								}}
								isRecipientForm={true}
							/>
						) : (
							<LockedFeature featureDescription="add recipient addresses and view them on a map">
								<AddressAutofillForm
									form={addressForm}
									onAddressChange={(address) => {
										setValue("address", address as RecipientAddressData);
										addressForm.setValue(
											"address",
											address as RecipientAddressData
										);
									}}
									isRecipientForm={true}
								/>
							</LockedFeature>
						)}
					</CardBody>
				</Card>

				<Card className="w-full">
					<CardHeader>
						<h3 className="text-lg font-semibold">Additional Notes</h3>
					</CardHeader>
					<CardBody>
						<Textarea
							value={watch("notes") || ""}
							onChange={(e) => setValue("notes", e.target.value)}
							label="Notes"
							placeholder="Add any additional notes"
							isInvalid={!!errors.notes}
							errorMessage={errors.notes?.message}
							variant="bordered"
							labelPlacement="outside"
							description="Optional: Add any additional notes about this recipient"
							className="w-full min-h-[100px]"
						/>
					</CardBody>
				</Card>

				<div className="flex justify-end">
					<Button
						type="submit"
						color="primary"
						className="bg-purple-500 hover:bg-purple-600"
					>
						Save Changes
					</Button>
				</div>
			</div>
		</Form>
	);
}
