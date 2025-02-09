"use client";

import { RecipientsTable } from "@/components/recipients/RecipientsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@heroui/react";
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
	const [activeTab, setActiveTab] = useState("table");
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
			<div className="container space-y-6 max-w-7xl">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Recipients</h1>
					<p className="mt-2 text-muted-foreground">
						Manage your recipients and their information.
					</p>
				</div>
				<div className="flex items-center justify-between">
					<Tabs
						defaultValue="table"
						className="w-full"
						onValueChange={setActiveTab}
					>
						<div className="flex items-center justify-between">
							<TabsList className="bg-secondary/20">
								<TabsTrigger
									value="table"
									className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
								>
									Table View
								</TabsTrigger>
								{subscriptionLevel !== "pro" ? (
									<Tooltip delayDuration={0}>
										<TooltipTrigger asChild>
											<div className="cursor-not-allowed">
												<TabsTrigger
													value="dotted-map"
													disabled
													className="flex items-center gap-1.5 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
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
									<TabsTrigger
										value="dotted-map"
										className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
									>
										Map View
									</TabsTrigger>
								)}
							</TabsList>
							{activeTab === "table" &&
								(hasReachedLimit ? (
									<Tooltip delayDuration={0}>
										<TooltipTrigger asChild>
											<div className="cursor-not-allowed">
												<Button
													isDisabled
													variant="bordered"
													isIconOnly
													color="secondary"
													radius="lg"
													className="ml-2 bg-secondary/20"
												>
													<Plus className="h-4 w-4" />
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
											<Button
												color="secondary"
												variant="solid"
												isIconOnly
												radius="lg"
												className="ml-2 bg-secondary hover:bg-secondary/80"
											>
												<Plus className="h-4 w-4" />
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Add Recipient</DialogTitle>
											</DialogHeader>
											<RecipientForm onSuccess={() => setIsDialogOpen(false)} />
										</DialogContent>
									</Dialog>
								))}
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
