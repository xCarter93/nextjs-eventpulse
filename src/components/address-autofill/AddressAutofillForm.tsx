"use client";

import { useState, useEffect, useRef } from "react";
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

type MapboxSuggestion = {
	mapbox_id: string;
	name: string;
	place_formatted?: string;
	place_name?: string;
	full_address?: string;
	description?: string;
	feature_type?: string;
};

export function AddressAutofillForm({
	form,
	onAddressChange,
	isRecipientForm = false,
}: AddressAutofillFormProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [suggestions, setSuggestions] = useState<Array<MapboxSuggestion>>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [sessionToken, setSessionToken] = useState("");
	const [dropdownPosition, setDropdownPosition] = useState({
		top: 0,
		left: 0,
		width: 0,
	});
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputContainerRef = useRef<HTMLDivElement>(null);

	const cityValue = form.watch("address.city");
	const countryValue = form.watch("address.country");

	// Generate a session token on component mount
	useEffect(() => {
		setSessionToken(crypto.randomUUID());
	}, []);

	// Handle search query changes
	useEffect(() => {
		if (!searchQuery.trim() || searchQuery.length < 2) {
			setSuggestions([]);
			return;
		}

		// Debounce search to avoid too many API calls
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				const response = await fetch(
					`https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
						searchQuery
					)}&types=place,country&limit=5&access_token=${
						env.NEXT_PUBLIC_MAPBOX_API_KEY
					}&session_token=${sessionToken}`
				);

				const data = await response.json();
				console.log("Suggestion data:", data.suggestions);
				setSuggestions(data.suggestions || []);
			} catch (error) {
				console.error("Error searching locations:", error);
			} finally {
				setIsSearching(false);
			}
		}, 300); // 300ms debounce time

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [searchQuery, sessionToken]);

	// Calculate dropdown position whenever suggestions change
	useEffect(() => {
		if (suggestions.length > 0 && inputContainerRef.current) {
			const rect = inputContainerRef.current.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			const dropdownHeight = Math.min(300, suggestions.length * 65); // Estimate height (65px per item)
			const margin = 10; // Add margin to prevent edge cases

			// Check if dropdown would go below viewport
			const wouldGoBelow = rect.bottom + dropdownHeight + margin > windowHeight;

			setDropdownPosition({
				// If would go below, position above input, otherwise below
				top: wouldGoBelow
					? rect.top + window.scrollY - dropdownHeight - margin
					: rect.bottom + window.scrollY + margin,
				left: rect.left + window.scrollX,
				width: rect.width,
			});
		}
	}, [suggestions]);

	// Add window resize listener to update dropdown position
	useEffect(() => {
		const handleResize = () => {
			if (suggestions.length > 0 && inputContainerRef.current) {
				const rect = inputContainerRef.current.getBoundingClientRect();
				const windowHeight = window.innerHeight;
				const dropdownHeight = Math.min(300, suggestions.length * 65);
				const margin = 10;

				const wouldGoBelow =
					rect.bottom + dropdownHeight + margin > windowHeight;

				setDropdownPosition({
					top: wouldGoBelow
						? rect.top + window.scrollY - dropdownHeight - margin
						: rect.bottom + window.scrollY + margin,
					left: rect.left + window.scrollX,
					width: rect.width,
				});
			}
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("scroll", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("scroll", handleResize);
		};
	}, [suggestions]);

	const handleSuggestionSelect = async (suggestion: MapboxSuggestion) => {
		try {
			setIsSearching(true);

			const response = await fetch(
				`https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?access_token=${env.NEXT_PUBLIC_MAPBOX_API_KEY}&session_token=${sessionToken}`
			);

			const data = await response.json();
			const feature = data.features?.[0];

			if (!feature) return;

			console.log("Retrieved feature:", feature);

			// Extract city and country information
			let place = feature.properties?.place || "";

			// Get country directly from context, which is the most reliable source
			let country = "";
			if (feature.properties?.context?.country?.name) {
				country = feature.properties.context.country.name;
			} else {
				// Fallback to other sources if context is not available
				country = feature.properties?.country || "";

				// If we still don't have a country but have place_formatted, extract it
				if (!country && suggestion.place_formatted) {
					const parts = suggestion.place_formatted.split(", ");
					if (parts.length > 0) {
						// The country is usually the last part
						country = parts[parts.length - 1];
					}
				}
			}

			// Get country code directly from context
			let countryCode = "";
			if (feature.properties?.context?.country?.country_code) {
				countryCode = feature.properties.context.country.country_code;
			} else {
				countryCode = feature.properties?.country_code || "";
			}

			const region = feature.properties?.region || "";

			// If place is empty, try to get it from context
			if (!place && feature.properties?.context?.place?.name) {
				place = feature.properties.context.place.name;
			}

			// If the place is empty but this is a country, use the country name as city
			if (!place && feature.properties?.feature_type === "country") {
				place = country;
			}

			// For regions and states, use them as city
			if (!place && feature.properties?.feature_type === "region") {
				place = region;
			}

			// If we still don't have a place name, use the suggestion name
			if (!place && suggestion.name) {
				place = suggestion.name;
			}

			const coordinates = {
				latitude: feature.geometry?.coordinates[1] || 0,
				longitude: feature.geometry?.coordinates[0] || 0,
			};

			const baseAddress = {
				city: place,
				country: country,
				coordinates,
			};

			const newAddress = isRecipientForm
				? baseAddress
				: {
						...baseAddress,
						countryCode: countryCode.toUpperCase(),
					};

			console.log("Setting new address:", newAddress);

			// Clear suggestions and search query first
			setSuggestions([]);
			setSearchQuery("");

			// Update form values with a slight delay to ensure render cycle completes
			setTimeout(() => {
				// Update form values immediately
				form.setValue("address.city", place, { shouldValidate: true });
				form.setValue("address.country", country, { shouldValidate: true });
				form.setValue("address.coordinates", coordinates, {
					shouldValidate: true,
				});

				if (!isRecipientForm && countryCode) {
					form.setValue("address.countryCode", countryCode.toUpperCase(), {
						shouldValidate: true,
					});
				}

				// Then call onAddressChange if provided
				if (onAddressChange) {
					onAddressChange(newAddress);
				}
			}, 0);

			// Generate a new session token after a complete session
			setSessionToken(crypto.randomUUID());
		} catch (error) {
			console.error("Error retrieving location details:", error);
		} finally {
			setIsSearching(false);
		}
	};

	return (
		<div className="flex flex-col gap-4" ref={containerRef}>
			<div className="relative">
				<div className="flex items-center gap-2" ref={inputContainerRef}>
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search for a city or country..."
						label="Location Search"
						variant="bordered"
						labelPlacement="outside"
						className="w-full"
					/>
					{isSearching && (
						<div className="text-sm text-gray-500">Loading...</div>
					)}
				</div>

				{suggestions.length > 0 && (
					<div
						className="fixed z-[100] bg-background border rounded-md shadow-lg overflow-y-auto dark:bg-gray-800 dark:text-white dark:border-gray-700"
						style={{
							top: `${dropdownPosition.top}px`,
							left: `${dropdownPosition.left}px`,
							width: `${dropdownPosition.width}px`,
							maxHeight: "300px",
						}}
					>
						{suggestions.map((suggestion) => (
							<div
								key={suggestion.mapbox_id}
								className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 border-gray-200 dark:border-gray-700"
								onClick={() => handleSuggestionSelect(suggestion)}
							>
								<div className="font-medium">{suggestion.name}</div>
								{suggestion.place_formatted && (
									<div className="text-sm text-gray-500 dark:text-gray-400">
										{suggestion.place_formatted}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<Input
					{...form.register("address.city")}
					value={cityValue || ""}
					autoComplete="address-level2"
					label="City"
					variant="bordered"
					labelPlacement="outside"
					isReadOnly
					isInvalid={!!form.formState.errors.address?.city}
					errorMessage={form.formState.errors.address?.city?.message}
				/>

				<Input
					{...form.register("address.country")}
					value={countryValue || ""}
					autoComplete="country"
					label="Country"
					variant="bordered"
					labelPlacement="outside"
					isReadOnly
					isInvalid={!!form.formState.errors.address?.country}
					errorMessage={form.formState.errors.address?.country?.message}
				/>
			</div>
		</div>
	);
}
