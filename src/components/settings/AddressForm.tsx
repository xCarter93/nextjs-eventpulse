"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { AddressData } from "@/app/settings/types";
import { env } from "@/env";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>;

interface MapboxFeature {
	place_name: string;
	text: string;
	properties: Record<string, unknown>;
	context: Array<{
		id: string;
		text: string;
		wikidata?: string;
		short_code?: string;
	}>;
	center: [number, number]; // [longitude, latitude]
}

interface AddressFormProps {
	value: AddressData;
	onChange: (address: AddressData) => void;
}

export function AddressForm({ value, onChange }: AddressFormProps) {
	const addressInputRef = useRef<HTMLInputElement>(null);
	const subscription = useQuery(api.subscriptions.getUserSubscription);
	const isSubscriptionActive =
		subscription && new Date(subscription.stripeCurrentPeriodEnd) > new Date();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			address: {
				line1: value.line1 || "",
				line2: value.line2,
				city: value.city || "",
				state: value.state || "",
				postalCode: value.postalCode || "",
				country: value.country || "",
				countryCode: value.countryCode || "",
				coordinates: value.coordinates || {
					latitude: 0,
					longitude: 0,
				},
			},
		},
	});

	// Update our form when parent value changes
	useEffect(() => {
		form.reset({
			address: {
				line1: value.line1 || "",
				line2: value.line2,
				city: value.city || "",
				state: value.state || "",
				postalCode: value.postalCode || "",
				country: value.country || "",
				countryCode: value.countryCode || "",
				coordinates: value.coordinates || {
					latitude: 0,
					longitude: 0,
				},
			},
		});
	}, [form, value]);

	useEffect(() => {
		if (
			addressInputRef.current &&
			env.NEXT_PUBLIC_MAPBOX_API_KEY &&
			isSubscriptionActive
		) {
			const input = addressInputRef.current;

			// Create a custom container for suggestions
			const suggestionsContainer = document.createElement("div");
			suggestionsContainer.className = "absolute z-50 w-full";
			input.parentElement?.appendChild(suggestionsContainer);

			let debounceTimeout: NodeJS.Timeout;
			const handleInput = async (e: Event) => {
				const target = e.target as HTMLInputElement;
				clearTimeout(debounceTimeout);
				debounceTimeout = setTimeout(async () => {
					if (target.value) {
						try {
							const response = await fetch(
								`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
									target.value
								)}.json?access_token=${
									env.NEXT_PUBLIC_MAPBOX_API_KEY
								}&types=address&limit=5`
							);
							const data = await response.json();
							if (data.features && data.features.length > 0) {
								suggestionsContainer.innerHTML = "";
								suggestionsContainer.className =
									"absolute z-50 w-full bg-background shadow-lg mt-0 border-x border-b rounded-b-md";
								data.features.forEach((feature: MapboxFeature) => {
									const div = document.createElement("div");
									div.className = "p-2 hover:bg-accent cursor-pointer";
									div.textContent = feature.place_name;
									div.onclick = () => {
										// Find country from context
										const country = feature.context?.find((ctx) =>
											ctx.id.startsWith("country.")
										);
										const region = feature.context?.find((ctx) =>
											ctx.id.startsWith("region.")
										);
										const postcode = feature.context?.find((ctx) =>
											ctx.id.startsWith("postcode.")
										);
										const place = feature.context?.find((ctx) =>
											ctx.id.startsWith("place.")
										);

										// Extract the street address from the full place name
										const streetAddress = feature.place_name.split(",")[0];

										const newAddress = {
											...form.getValues().address,
											line1: streetAddress,
											city: place?.text || "",
											state: region?.text || "",
											postalCode: postcode?.text || "",
											country: country?.text || "",
											countryCode: country?.short_code?.toUpperCase() || "",
											coordinates: {
												latitude: feature.center[1],
												longitude: feature.center[0],
											},
										};

										form.setValue("address", newAddress);
										onChange(newAddress);

										suggestionsContainer.innerHTML = "";
										suggestionsContainer.className = "absolute z-50 w-full";
									};
									suggestionsContainer.appendChild(div);
								});
							} else {
								suggestionsContainer.innerHTML = "";
								suggestionsContainer.className = "absolute z-50 w-full";
							}
						} catch (error) {
							console.error("Error fetching addresses:", error);
							suggestionsContainer.innerHTML = "";
							suggestionsContainer.className = "absolute z-50 w-full";
						}
					} else {
						suggestionsContainer.innerHTML = "";
						suggestionsContainer.className = "absolute z-50 w-full";
					}
				}, 300);
			};

			input.addEventListener("input", handleInput);

			return () => {
				clearTimeout(debounceTimeout);
				input.removeEventListener("input", handleInput);
				suggestionsContainer.remove();
			};
		}
	}, [form, isSubscriptionActive, onChange]);

	return (
		<Form {...form}>
			<div className="space-y-4">
				<div className="space-y-2">
					<FormField
						control={form.control}
						name="address.line1"
						render={({ field }) => (
							<FormItem className="relative">
								<FormLabel>Street Address</FormLabel>
								<FormControl>
									<Input
										{...field}
										ref={addressInputRef}
										placeholder="Start typing to search address..."
										className="focus-visible:ring-2"
										onChange={(e) => {
											field.onChange(e);
											onChange({
												...form.getValues().address,
												line1: e.target.value,
											});
										}}
									/>
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
										placeholder="Optional"
										{...field}
										onChange={(e) => {
											field.onChange(e);
											onChange({
												...form.getValues().address,
												line2: e.target.value,
											});
										}}
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
									<Input
										{...field}
										onChange={(e) => {
											field.onChange(e);
											onChange({
												...form.getValues().address,
												city: e.target.value,
											});
										}}
									/>
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
									<Input
										{...field}
										onChange={(e) => {
											field.onChange(e);
											onChange({
												...form.getValues().address,
												state: e.target.value,
											});
										}}
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
						name="address.postalCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Postal Code</FormLabel>
								<FormControl>
									<Input
										{...field}
										onChange={(e) => {
											field.onChange(e);
											onChange({
												...form.getValues().address,
												postalCode: e.target.value,
											});
										}}
									/>
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
									<Input {...field} readOnly />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</Form>
	);
}
