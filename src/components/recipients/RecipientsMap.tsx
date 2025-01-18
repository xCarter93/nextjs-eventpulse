"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../convex/_generated/dataModel";
import type {
	MapContainer as MapContainerType,
	TileLayer as TileLayerType,
	Marker as MarkerType,
	Popup as PopupType,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Create a custom icon using Lucide MapPin
const icon = L.divIcon({
	html: renderToStaticMarkup(
		<MapPin className="h-6 w-6 text-primary -mt-6 -ml-3" fill="currentColor" />
	),
	className: "custom-marker",
});

interface Recipient {
	_id: Id<"recipients">;
	name: string;
	metadata?: {
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
}

// Dynamically import MapContainer to avoid SSR issues
const MapContainer = dynamic(
	() => import("react-leaflet").then((mod) => mod.MapContainer),
	{
		ssr: false,
		loading: () => <Skeleton className="w-full h-[600px] rounded-lg" />,
	}
) as typeof MapContainerType;

const TileLayer = dynamic(
	() => import("react-leaflet").then((mod) => mod.TileLayer),
	{ ssr: false }
) as typeof TileLayerType;

const Marker = dynamic(
	() => import("react-leaflet").then((mod) => mod.Marker),
	{ ssr: false }
) as typeof MarkerType;

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
	ssr: false,
}) as typeof PopupType;

export function RecipientsMap() {
	const recipients = useQuery(api.recipients.getRecipients) as
		| Recipient[]
		| undefined;

	if (!recipients) {
		return <Skeleton className="w-full h-[600px] rounded-lg" />;
	}

	// Filter recipients with valid coordinates
	const recipientsWithCoordinates = recipients.filter(
		(recipient) => recipient.metadata?.address?.coordinates
	);

	if (recipientsWithCoordinates.length === 0) {
		return (
			<div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/10">
				<p className="text-muted-foreground">
					No recipients with addresses found
				</p>
			</div>
		);
	}

	// Calculate center of the map based on first recipient or default to a central location
	const defaultCenter = recipientsWithCoordinates[0]?.metadata?.address
		?.coordinates
		? [
				recipientsWithCoordinates[0].metadata.address.coordinates.latitude,
				recipientsWithCoordinates[0].metadata.address.coordinates.longitude,
			]
		: [0, 0];

	return (
		<div className="h-[600px] w-full rounded-lg overflow-hidden border">
			<MapContainer
				center={defaultCenter as [number, number]}
				zoom={3}
				scrollWheelZoom={true}
				style={{ height: "100%", width: "100%" }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				{recipientsWithCoordinates.map((recipient) => {
					const coords = recipient.metadata?.address?.coordinates;
					if (!coords) return null;

					return (
						<Marker
							key={recipient._id}
							position={[coords.latitude, coords.longitude]}
							icon={icon}
						>
							<Popup>
								<div className="p-2">
									<h3 className="font-semibold">{recipient.name}</h3>
									<p className="text-sm text-muted-foreground">
										{recipient.metadata?.address?.line1}
										{recipient.metadata?.address?.line2 && (
											<>, {recipient.metadata.address.line2}</>
										)}
										<br />
										{recipient.metadata?.address?.city},{" "}
										{recipient.metadata?.address?.state}{" "}
										{recipient.metadata?.address?.postalCode}
										<br />
										{recipient.metadata?.address?.country}
									</p>
								</div>
							</Popup>
						</Marker>
					);
				})}
			</MapContainer>
		</div>
	);
}
