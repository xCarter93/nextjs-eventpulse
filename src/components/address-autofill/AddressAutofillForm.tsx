"use client";

import { AddressAutofill } from "@mapbox/search-js-react";
import { env } from "@/env";
import { Input } from "@heroui/react";
import { UseFormReturn } from "react-hook-form";
import { AddressData, RecipientAddressData } from "@/app/settings/types";

type AddressFormFields = {
	address: AddressData | RecipientAddressData;
};

interface AddressAutofillFormProps {
	form: UseFormReturn<AddressFormFields>;
	onAddressChange?: (address: AddressData | RecipientAddressData) => void;
	isRecipientForm?: boolean;
}

export function AddressAutofillForm({
	form,
	onAddressChange,
	isRecipientForm = false,
}: AddressAutofillFormProps) {
	const countryValue = form.watch("address.country");
	const line1Value = form.watch("address.line1");
	const line2Value = form.watch("address.line2");
	const cityValue = form.watch("address.city");
	const stateValue = form.watch("address.state");
	const postalCodeValue = form.watch("address.postalCode");

	const handleRetrieve = (response: {
		features: Array<{
			properties: {
				address_line1?: string;
				place?: string;
				region?: string;
				postcode?: string;
				country?: string;
				country_code?: string;
				full_address?: string;
			};
			context?: Array<{
				id: string;
				text: string;
				text_en?: string;
			}>;
			geometry: {
				coordinates: [number, number];
			};
		}>;
	}) => {
		const feature = response.features[0];
		if (!feature) return;

		const countryName = feature.properties.country || "";

		const coordinates = {
			latitude: feature.geometry.coordinates[1] || 0,
			longitude: feature.geometry.coordinates[0] || 0,
		};

		const baseAddress = {
			line1: feature.properties.address_line1 || "",
			line2: form.getValues().address.line2,
			city: feature.properties.place || "",
			state: feature.properties.region || "",
			postalCode: feature.properties.postcode || "",
			country: countryName,
			coordinates,
		};

		const newAddress = isRecipientForm
			? baseAddress
			: {
					...baseAddress,
					countryCode: feature.properties.country_code?.toUpperCase() || "",
				};

		onAddressChange?.(newAddress);

		setTimeout(() => {
			form.setValue("address.line1", newAddress.line1, {
				shouldValidate: true,
			});
			form.setValue("address.line2", newAddress.line2, {
				shouldValidate: true,
			});
			form.setValue("address.city", newAddress.city, { shouldValidate: true });
			form.setValue("address.state", newAddress.state, {
				shouldValidate: true,
			});
			form.setValue("address.postalCode", newAddress.postalCode, {
				shouldValidate: true,
			});
			form.setValue("address.country", newAddress.country, {
				shouldValidate: true,
			});

			if (!isRecipientForm) {
				form.setValue(
					"address.countryCode",
					(newAddress as AddressData).countryCode,
					{
						shouldValidate: true,
					}
				);
			}
			form.setValue("address.coordinates", newAddress.coordinates, {
				shouldValidate: true,
			});
		}, 0);
	};

	return (
		<div className="flex flex-col gap-4">
			<div>
				<AddressAutofill
					accessToken={env.NEXT_PUBLIC_MAPBOX_API_KEY}
					onRetrieve={handleRetrieve}
				>
					<Input
						{...form.register("address.line1")}
						value={line1Value}
						autoComplete="shipping address-line1"
						placeholder="Start typing to search address..."
						label="Street Address"
						variant="bordered"
						labelPlacement="outside"
						isRequired
						isInvalid={!!form.formState.errors.address?.line1}
						errorMessage={form.formState.errors.address?.line1?.message}
						className="mb-4"
					/>
				</AddressAutofill>
			</div>

			<div>
				<Input
					{...form.register("address.line2")}
					value={line2Value}
					autoComplete="shipping address-line2"
					placeholder="Optional"
					label="Apartment, suite, etc."
					variant="bordered"
					labelPlacement="outside"
					isInvalid={!!form.formState.errors.address?.line2}
					errorMessage={form.formState.errors.address?.line2?.message}
					className="mb-4"
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<Input
					{...form.register("address.city")}
					value={cityValue}
					autoComplete="shipping address-level2"
					label="City"
					variant="bordered"
					labelPlacement="outside"
					isRequired
					isInvalid={!!form.formState.errors.address?.city}
					errorMessage={form.formState.errors.address?.city?.message}
				/>

				<Input
					{...form.register("address.state")}
					value={stateValue}
					autoComplete="shipping address-level1"
					label="State / Province"
					variant="bordered"
					labelPlacement="outside"
					isRequired
					isInvalid={!!form.formState.errors.address?.state}
					errorMessage={form.formState.errors.address?.state?.message}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<Input
					{...form.register("address.postalCode")}
					value={postalCodeValue}
					autoComplete="shipping postal-code"
					label="Postal Code"
					variant="bordered"
					labelPlacement="outside"
					isRequired
					isInvalid={!!form.formState.errors.address?.postalCode}
					errorMessage={form.formState.errors.address?.postalCode?.message}
				/>

				<Input
					value={countryValue}
					autoComplete="shipping country"
					label="Country"
					variant="bordered"
					labelPlacement="outside"
					isRequired
					isReadOnly
					isInvalid={!!form.formState.errors.address?.country}
					errorMessage={form.formState.errors.address?.country?.message}
				/>
			</div>
		</div>
	);
}
