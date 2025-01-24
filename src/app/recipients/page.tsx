"use client";

import { RecipientsTable } from "@/components/recipients/RecipientsTable";
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
import { Suspense } from "react";
import { DottedMapComponent } from "@/components/recipients/DottedMap";

export default function RecipientsPage() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	return (
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
							<TabsTrigger value="dotted-map">Map View</TabsTrigger>
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
					<TabsContent value="table" className="space-y-4">
						<Suspense fallback={<div>Loading...</div>}>
							<RecipientsTable />
						</Suspense>
					</TabsContent>
					<TabsContent value="dotted-map">
						<Suspense fallback={<div>Loading...</div>}>
							<DottedMapComponent />
						</Suspense>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
