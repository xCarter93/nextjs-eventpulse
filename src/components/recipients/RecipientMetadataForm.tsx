"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

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
import { env } from "@/env";
import { LockedFeature } from "@/components/premium/LockedFeature";

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

const formSchema = z.object({
	relation: z.enum(["friend", "parent", "spouse", "sibling"]).optional(),
	anniversaryDate: z.date().optional(),
	notes: z.string().optional(),
	nickname: z.string().optional(),
	phoneNumber: z.string().optional(),
	address: z
		.object({
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
		})
		.optional(),
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
			address?: {
				line1?: string;
				line2?: string;
				city?: string;
				state?: string;
				postalCode?: string;
				country?: string;
				coordinates?: {
					latitude: number;
					longitude: number;
				};
			};
		};
	};
}

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

export function RecipientMetadataForm({
	recipient,
}: RecipientMetadataFormProps) {
	const addressInputRef = useRef<HTMLInputElement>(null);
	const updateRecipientMetadata = useMutation(
		api.recipients.updateRecipientMetadata
	);
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

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
			address: {
				line1: recipient.metadata?.address?.line1 || "",
				line2: recipient.metadata?.address?.line2 || "",
				city: recipient.metadata?.address?.city || "",
				state: recipient.metadata?.address?.state || "",
				postalCode: recipient.metadata?.address?.postalCode || "",
				country: recipient.metadata?.address?.country || "",
				coordinates: recipient.metadata?.address?.coordinates,
			},
		},
	});

	const relation = form.watch("relation");

	useEffect(() => {
		if (addressInputRef.current && env.NEXT_PUBLIC_MAPBOX_API_KEY) {
			const input = addressInputRef.current;

			// Create a custom container for suggestions
			const suggestionsContainer = document.createElement("div");
			suggestionsContainer.className = "absolute z-50 w-full";
			input.parentElement?.appendChild(suggestionsContainer);

			let debounceTimeout: NodeJS.Timeout;
			input.addEventListener("input", (e: Event) => {
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

										form.setValue("address.line1", streetAddress);
										form.setValue("address.city", place?.text || "");
										form.setValue("address.state", region?.text || "");
										form.setValue("address.postalCode", postcode?.text || "");
										form.setValue("address.country", country?.text || "");
										form.setValue("address.coordinates", {
											latitude: feature.center[1],
											longitude: feature.center[0],
										});

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
			});

			return () => {
				clearTimeout(debounceTimeout);
				suggestionsContainer.remove();
			};
		}
	}, [form]);

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
					address: data.address,
				},
			});
			toast.success("Recipient metadata updated successfully");
		} catch (error) {
			toast.error("Failed to update recipient metadata");
			console.error(error);
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
					{subscriptionLevel === "pro" ? (
						<div className="grid gap-4">
							<FormField
								control={form.control}
								name="address.line1"
								render={({ field: { onChange, value, ...fieldProps } }) => (
									<FormItem className="relative">
										<FormLabel>Address Line 1</FormLabel>
										<FormControl>
											<Input
												{...fieldProps}
												ref={addressInputRef}
												value={value}
												onChange={onChange}
												placeholder="Start typing to search address..."
												className="focus-visible:ring-2"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="address.line2"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Address Line 2</FormLabel>
										<FormControl>
											<Input placeholder="Apartment, suite, etc." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-3 gap-4">
								<FormField
									control={form.control}
									name="address.city"
									render={({ field }) => (
										<FormItem>
											<FormLabel>City</FormLabel>
											<FormControl>
												<Input placeholder="City" {...field} />
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
											<FormLabel>State/Province</FormLabel>
											<FormControl>
												<Input placeholder="State/Province" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address.postalCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Postal Code</FormLabel>
											<FormControl>
												<Input placeholder="Postal code" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					) : (
						<LockedFeature featureDescription="add recipient addresses and view them on a map">
							<div className="grid gap-4">
								<FormField
									control={form.control}
									name="address.line1"
									render={({ field: { onChange, value, ...fieldProps } }) => (
										<FormItem className="relative">
											<FormLabel>Address Line 1</FormLabel>
											<FormControl>
												<Input
													{...fieldProps}
													ref={addressInputRef}
													value={value}
													onChange={onChange}
													placeholder="Start typing to search address..."
													className="focus-visible:ring-2"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address.line2"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Address Line 2</FormLabel>
											<FormControl>
												<Input
													placeholder="Apartment, suite, etc."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="address.city"
										render={({ field }) => (
											<FormItem>
												<FormLabel>City</FormLabel>
												<FormControl>
													<Input placeholder="City" {...field} />
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
												<FormLabel>State/Province</FormLabel>
												<FormControl>
													<Input placeholder="State/Province" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="address.postalCode"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Postal Code</FormLabel>
												<FormControl>
													<Input placeholder="Postal code" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>
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
