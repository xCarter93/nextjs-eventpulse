"use client";

import { RecipientsTable } from "@/components/recipients/RecipientsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { RecipientForm } from "@/components/recipients/RecipientForm";
import { useState } from "react";
import { Suspense } from "react";
import { DottedMapComponent } from "@/components/recipients/DottedMap";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TooltipProvider,
} from "@/components/ui/tooltip";
import { getSubscriptionLimits } from "@/lib/subscriptions";

export default function RecipientsPage() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const recipients = useQuery(api.recipients.getRecipients);
	const limits = getSubscriptionLimits(subscriptionLevel ?? "free");
	const hasReachedLimit = recipients
		? recipients.length >= limits.maxRecipients
		: false;

	return (
		<TooltipProvider>
			<div className="container py-4 space-y-4 max-w-7xl">
				<div className="flex flex-col gap-4">
					<div>
						<h1 className="text-4xl font-bold tracking-tight">Recipients</h1>
						<p className="text-lg text-muted-foreground">
							Manage your recipients and their information.
						</p>
					</div>
					<Tabs defaultValue="table">
						<div className="flex items-center justify-between">
							<TabsList>
								<TabsTrigger value="table">Table View</TabsTrigger>
								{subscriptionLevel !== "pro" ? (
									<Tooltip delayDuration={0}>
										<TooltipTrigger asChild>
											<div className="cursor-not-allowed">
												<TabsTrigger
													value="dotted-map"
													disabled
													className="flex items-center gap-1.5"
												>
													Map View
													<Lock className="h-3.5 w-3.5 ml-1.5" />
												</TabsTrigger>
											</div>
										</TooltipTrigger>
										<TooltipContent>
											<p>Upgrade to Pro to view recipient locations on a map</p>
										</TooltipContent>
									</Tooltip>
								) : (
									<TabsTrigger value="dotted-map">Map View</TabsTrigger>
								)}
							</TabsList>
							{hasReachedLimit ? (
								<Tooltip delayDuration={0}>
									<TooltipTrigger asChild>
										<div className="cursor-not-allowed">
											<Button
												variant="outline"
												className="flex items-center gap-1.5"
												disabled
											>
												<Lock className="h-3.5 w-3.5" />
												<Plus className="mr-2 h-4 w-4" />
												New Recipient
											</Button>
										</div>
									</TooltipTrigger>
									<TooltipContent>
										<p>
											You have reached your recipient limit (
											{limits.maxRecipients}). Upgrade to Pro for unlimited
											recipients.
										</p>
									</TooltipContent>
								</Tooltip>
							) : (
								<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
									<DialogTrigger asChild>
										<Button>
											<Plus className="mr-2 h-4 w-4" />
											New Recipient
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Add Recipient</DialogTitle>
										</DialogHeader>
										<RecipientForm onSuccess={() => setIsDialogOpen(false)} />
									</DialogContent>
								</Dialog>
							)}
						</div>
						<TabsContent value="table" className="space-y-4">
							<Suspense fallback={<div>Loading...</div>}>
								<RecipientsTable />
							</Suspense>
						</TabsContent>
						<TabsContent value="dotted-map">
							<Suspense fallback={<div>Loading...</div>}>
								{subscriptionLevel === "pro" ? (
									<DottedMapComponent />
								) : (
									<LockedFeature featureDescription="view recipient locations on a map">
										<DottedMapComponent />
									</LockedFeature>
								)}
							</Suspense>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</TooltipProvider>
	);
}
