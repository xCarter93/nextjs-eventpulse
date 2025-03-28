"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@heroui/react";
import { AddressAutofillForm } from "@/components/address-autofill/AddressAutofillForm";
import { AddressData, RecipientAddressData } from "@/app/settings/types";
import { useEffect } from "react";

const addressSchema = z.object({
	address: z.object({
		city: z.string(),
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
	city: "",
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

	const handleSubmit = form.handleSubmit(() => {
		// This is just to satisfy HeroUI's Form requirement for onSubmit
		// The actual updates are handled by the onChange prop
	});

	return (
		<Form onSubmit={handleSubmit} className="w-full">
			<div className="w-full">
				<AddressAutofillForm
					form={form}
					onAddressChange={(address) => {
						onChange(address as AddressData);
					}}
					isRecipientForm={false}
				/>
			</div>
		</Form>
	);
}
