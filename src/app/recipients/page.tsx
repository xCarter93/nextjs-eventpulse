"use client";

import { RecipientsTable } from "@/components/recipients/RecipientsTable";
import { RecipientsMap } from "@/components/recipients/RecipientsMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { RecipientForm } from "@/components/recipients/RecipientForm";
import { useState } from "react";

export default function RecipientsPage() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	return (
		<div className="container py-8">
			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Recipients</h1>
					<p className="text-muted-foreground mt-2">
						View and manage your recipients and their information.
					</p>
				</div>
				<Tabs defaultValue="list" className="space-y-4">
					<div className="flex items-center justify-between">
						<TabsList>
							<TabsTrigger value="list">List View</TabsTrigger>
							<TabsTrigger value="map">Map View</TabsTrigger>
						</TabsList>
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
					</div>
					<TabsContent value="list">
						<RecipientsTable />
					</TabsContent>
					<TabsContent value="map">
						<RecipientsMap />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
