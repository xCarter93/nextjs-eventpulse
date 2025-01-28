"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { AddressAutofillForm } from "@/components/address-autofill/AddressAutofillForm";
import { AddressData, RecipientAddressData } from "@/app/settings/types";
import { useEffect } from "react";

const addressSchema = z.object({
	address: z.object({
		line1: z.string(),
		line2: z.string().optional(),
		city: z.string(),
		state: z.string(),
		postalCode: z.string(),
		country: z.string(),
		countryCode: z.string(),
		coordinates: z.object({
			latitude: z.number(),
			longitude: z.number(),
		}),
	}),
});

type AddressFormFields = {
	address: AddressData | RecipientAddressData;
};

const emptyAddress: AddressData = {
	line1: "",
	line2: "",
	city: "",
	state: "",
	postalCode: "",
	country: "",
	countryCode: "",
	coordinates: {
		latitude: 0,
		longitude: 0,
	},
};

export function AddressForm({
	defaultAddress,
	onChange,
}: {
	defaultAddress?: AddressData;
	onChange: (address: AddressData) => void;
}) {
	const form = useForm<AddressFormFields>({
		resolver: zodResolver(addressSchema),
		defaultValues: {
			address: defaultAddress ?? emptyAddress,
		},
	});

	// Update form when defaultAddress changes
	useEffect(() => {
		form.reset({
			address: defaultAddress ?? emptyAddress,
		});
	}, [form, defaultAddress]);

	return (
		<Form {...form}>
			<AddressAutofillForm
				form={form}
				onAddressChange={(address) => {
					onChange(address as AddressData);
				}}
				isRecipientForm={false}
			/>
		</Form>
	);
}
