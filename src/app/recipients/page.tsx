"use client";

import { RecipientsTable } from "@/components/recipients/RecipientsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@heroui/react";
import { Lock } from "lucide-react";
import { Suspense, lazy, useEffect } from "react";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageWithStats } from "@/components/shared/PageWithStats";

// Use React.lazy instead of dynamic import
const DottedMapComponent = lazy(() =>
	import("@/components/recipients/DottedMap").then((mod) => ({
		default: mod.DottedMapComponent,
	}))
);

// Loading state component
function MapLoadingState() {
	return (
		<div className="min-h-[400px] flex items-center justify-center">
			<div className="text-center space-y-4">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
				<p className="text-sm text-muted-foreground">Loading map view...</p>
			</div>
		</div>
	);
}

// Separate data loading component
function MapContent() {
	const recipients = useQuery(api.recipients.getRecipients);
	const user = useQuery(api.users.getUser);

	if (!recipients || !user) {
		return <MapLoadingState />;
	}

	if (!user.settings?.address?.coordinates) {
		return (
			<div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/10">
				<p className="text-muted-foreground">
					Please set your address in settings to view the map
				</p>
			</div>
		);
	}

	// Wrap the actual map component in Suspense
	return (
		<Suspense fallback={<MapLoadingState />}>
			<DottedMapComponent />
		</Suspense>
	);
}

// Wrap map component with suspense for data loading
function MapWithSuspense() {
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

	// Start preloading the map component when this component mounts
	useEffect(() => {
		if (subscriptionLevel === "pro") {
			const preloadMap = () => import("@/components/recipients/DottedMap");
			preloadMap();
		}
	}, [subscriptionLevel]);

	return (
		<Suspense fallback={<MapLoadingState />}>
			{subscriptionLevel === "pro" ? (
				<MapContent />
			) : (
				<LockedFeature featureDescription="view recipient locations on a map">
					<MapContent />
				</LockedFeature>
			)}
		</Suspense>
	);
}

export default function RecipientsPage() {
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

	return (
		<PageWithStats>
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Recipients</h1>
					<p className="mt-2 text-muted-foreground">
						Manage your recipients and their information.
					</p>
				</div>
				<Tabs defaultValue="table" className="w-full">
					<div className="flex items-center justify-between">
						<TabsList className="bg-secondary/20">
							<TabsTrigger
								value="table"
								className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
							>
								Table View
							</TabsTrigger>
							{subscriptionLevel !== "pro" ? (
								<Tooltip
									content="Upgrade to Pro to view recipient locations on a map"
									color="secondary"
								>
									<div className="cursor-not-allowed">
										<TabsTrigger
											value="dotted-map"
											disabled
											className="flex items-center gap-1.5 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
										>
											Map View
											<Lock className="h-3.5 w-3.5 ml-1.5" />
										</TabsTrigger>
									</div>
								</Tooltip>
							) : (
								<TabsTrigger
									value="dotted-map"
									className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
								>
									Map View
								</TabsTrigger>
							)}
						</TabsList>
					</div>
					<TabsContent value="table" className="space-y-4">
						<Suspense fallback={<div>Loading...</div>}>
							<RecipientsTable />
						</Suspense>
					</TabsContent>
					<TabsContent value="dotted-map">
						<MapWithSuspense />
					</TabsContent>
				</Tabs>
			</div>
		</PageWithStats>
	);
}
