import { RecipientsTable } from "@/components/recipients/RecipientsTable";

export default function RecipientsPage() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-foreground">Recipients</h1>
			</div>
			<RecipientsTable />
		</div>
	);
}
