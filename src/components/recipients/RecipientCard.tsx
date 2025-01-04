import { type Recipient } from "@/types";
import { formatDate } from "@/utils/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RecipientCardProps {
	recipient: Recipient;
	onEdit: (recipient: Recipient) => void;
	onDelete: (id: string) => void;
}

export function RecipientCard({
	recipient,
	onEdit,
	onDelete,
}: RecipientCardProps) {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex justify-between items-start">
					<div>
						<h3 className="text-lg font-semibold text-card-foreground">
							{recipient.name}
						</h3>
						<p className="text-muted-foreground">{recipient.email}</p>
						<p className="text-sm text-muted-foreground">
							Birthday: {formatDate(recipient.birthday)}
						</p>
					</div>
					<div className="space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onEdit(recipient)}
						>
							Edit
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => onDelete(recipient.id)}
						>
							Delete
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
