import { Metadata } from "next";
import { RecipientsTable } from "@/components/recipients/RecipientsTable";
import { RecipientsMap } from "@/components/recipients/RecipientsMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
	title: "Recipients | EventPulse",
	description: "Manage your recipients and their information.",
};

export default function RecipientsPage() {
	return (
		<div className="container py-8">
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Recipients</h1>
						<p className="text-muted-foreground mt-2">
							View and manage your recipients and their information.
						</p>
					</div>
				</div>
				<Tabs defaultValue="list">
					<TabsList>
						<TabsTrigger value="list">List View</TabsTrigger>
						<TabsTrigger value="map">Map View</TabsTrigger>
					</TabsList>
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
