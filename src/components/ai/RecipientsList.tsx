import { User, Mail, Calendar } from "lucide-react";

interface Recipient {
	id: string;
	name: string;
	email: string;
	birthday: string;
}

interface RecipientsListProps {
	recipients: Recipient[];
	searchQuery?: string;
}

export function RecipientsList({
	recipients,
	searchQuery,
}: RecipientsListProps) {
	if (recipients.length === 0) {
		return (
			<div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
				<p className="text-gray-600">
					No contacts found {searchQuery && `matching "${searchQuery}"`}.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 mb-3">
				<User className="h-5 w-5 text-primary" />
				<h3 className="font-semibold">
					Found {recipients.length} contact{recipients.length !== 1 ? "s" : ""}
				</h3>
			</div>

			<div className="space-y-2">
				{recipients.map((recipient) => (
					<div
						key={recipient.id}
						className="p-3 bg-white border border-gray-200 rounded-lg hover:border-primary/30 transition-colors"
					>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<User className="h-4 w-4 text-blue-500" />
								<span className="font-medium">{recipient.name}</span>
							</div>

							<div className="flex items-center gap-2 text-sm text-gray-600">
								<Mail className="h-3 w-3" />
								<span>{recipient.email}</span>
							</div>

							<div className="flex items-center gap-2 text-sm text-gray-600">
								<Calendar className="h-3 w-3" />
								<span>Birthday: {recipient.birthday}</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
