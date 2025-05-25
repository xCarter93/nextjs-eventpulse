import { Button } from "@heroui/react";
import { User, ExternalLink } from "lucide-react";

interface RecipientCreatedProps {
	name: string;
	email: string;
	birthday: string;
	recipientId: string;
}

export function RecipientCreated({
	name,
	email,
	birthday,
	recipientId,
}: RecipientCreatedProps) {
	return (
		<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
			<div className="flex items-center gap-2">
				<User className="h-5 w-5 text-blue-600" />
				<h3 className="font-semibold text-blue-800">
					Contact Added Successfully!
				</h3>
			</div>

			<div className="space-y-1">
				<p className="font-medium text-blue-700">{name}</p>
				<p className="text-sm text-blue-600">{email}</p>
				<p className="text-sm text-blue-600">Birthday: {birthday}</p>
			</div>

			<Button
				size="sm"
				color="primary"
				variant="light"
				startContent={<ExternalLink className="h-4 w-4" />}
				onClick={() => window.open(`/recipients/${recipientId}`, "_blank")}
			>
				View Contact
			</Button>
		</div>
	);
}
