"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressData } from "@/app/settings/types";
import { env } from "@/env";

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

	useEffect(() => {
		if (addressInputRef.current && env.NEXT_PUBLIC_MAPBOX_API_KEY) {
			const cleanup = setupMapboxAutocomplete(addressInputRef.current);
			return () => cleanup();
		}
	}, []);

	const setupMapboxAutocomplete = (input: HTMLInputElement) => {
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

									onChange({
										...value,
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
									});

									suggestionsContainer.innerHTML = "";
									suggestionsContainer.className = "absolute z-50 w-full";
									input.value = streetAddress;
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
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="line1">Street Address</Label>
				<div className="relative">
					<Input
						ref={addressInputRef}
						id="line1"
						placeholder="Start typing to search address..."
						value={value.line1}
						onChange={(e) => onChange({ ...value, line1: e.target.value })}
						className="focus-visible:ring-2"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="line2">Apartment, suite, etc.</Label>
				<Input
					id="line2"
					placeholder="Optional"
					value={value.line2 || ""}
					onChange={(e) => onChange({ ...value, line2: e.target.value })}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="city">City</Label>
					<Input
						id="city"
						value={value.city}
						onChange={(e) => onChange({ ...value, city: e.target.value })}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="state">State / Province</Label>
					<Input
						id="state"
						value={value.state}
						onChange={(e) => onChange({ ...value, state: e.target.value })}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="postalCode">Postal Code</Label>
					<Input
						id="postalCode"
						value={value.postalCode}
						onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="country">Country</Label>
					<Input
						id="country"
						value={value.country}
						onChange={(e) => onChange({ ...value, country: e.target.value })}
						readOnly
					/>
				</div>
			</div>
		</div>
	);
}
