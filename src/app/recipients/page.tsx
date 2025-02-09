"use client";

import { RecipientsTable } from "@/components/recipients/RecipientsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, Tooltip } from "@heroui/react";
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
						{activeTab === "table" &&
							(hasReachedLimit ? (
								<Tooltip
									content="You have reached your recipient limit. Upgrade to Pro for unlimited recipients."
									color="secondary"
								>
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
								</Tooltip>
							) : (
								<Tooltip
									content="Add New Recipient"
									color="secondary"
									placement="bottom"
								>
									<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
										<DialogTrigger asChild>
											<Button
												color="secondary"
												variant="solid"
												isIconOnly
												radius="lg"
												className="ml-2 bg-purple-500 hover:bg-purple-600"
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
								</Tooltip>
							))}
					</div>
					<TabsContent value="table" className="space-y-4">
						<Suspense fallback={<div>Loading...</div>}>
							<RecipientsTable />
						</Suspense>
					</TabsContent>
					<TabsContent value="dotted-map">
						<Suspense
							fallback={
								<div className="min-h-[400px] flex items-center justify-center">
									<div className="text-center space-y-4">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
										<p className="text-sm text-muted-foreground">
											Loading map view...
										</p>
									</div>
								</div>
							}
						>
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
	);
}
