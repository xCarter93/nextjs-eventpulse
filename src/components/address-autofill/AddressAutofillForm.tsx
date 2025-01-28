"use client";

import { AddressAutofill } from "@mapbox/search-js-react";
import { env } from "@/env";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
		<div className="space-y-4">
			<div className="space-y-2">
				<FormField
					control={form.control}
					name="address.line1"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Street Address</FormLabel>
							<FormControl>
								<AddressAutofill
									accessToken={env.NEXT_PUBLIC_MAPBOX_API_KEY}
									onRetrieve={handleRetrieve}
								>
									<Input
										{...field}
										autoComplete="shipping address-line1"
										placeholder="Start typing to search address..."
										className="focus-visible:ring-2"
									/>
								</AddressAutofill>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="space-y-2">
				<FormField
					control={form.control}
					name="address.line2"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Apartment, suite, etc.</FormLabel>
							<FormControl>
								<Input
									{...field}
									autoComplete="shipping address-line2"
									placeholder="Optional"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="address.city"
					render={({ field }) => (
						<FormItem>
							<FormLabel>City</FormLabel>
							<FormControl>
								<Input {...field} autoComplete="shipping address-level2" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="address.state"
					render={({ field }) => (
						<FormItem>
							<FormLabel>State / Province</FormLabel>
							<FormControl>
								<Input {...field} autoComplete="shipping address-level1" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="address.postalCode"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Postal Code</FormLabel>
							<FormControl>
								<Input {...field} autoComplete="shipping postal-code" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="address.country"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Country</FormLabel>
							<FormControl>
								<Input {...field} autoComplete="shipping country" readOnly />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</div>
	);
}
