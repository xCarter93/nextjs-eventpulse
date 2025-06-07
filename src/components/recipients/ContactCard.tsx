"use client";

import { Card, CardBody, Avatar, Chip } from "@heroui/react";
import { Phone, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";

interface Recipient {
	_id: Id<"recipients">;
	name: string;
	email: string;
	birthday: number;
	groupIds?: Id<"groups">[];
	metadata?: {
		relation?: "friend" | "parent" | "spouse" | "sibling";
		phoneNumber?: string;
		address?: {
			city?: string;
			country?: string;
		};
		notes?: string;
	};
}

interface Group {
	_id: Id<"groups"> | string;
	name: string;
	color?: string;
}

interface ContactCardProps {
	recipient: Recipient;
	groups?: Group[];
	onSelect?: (recipientId: Id<"recipients">) => void;
}

export function ContactCard({
	recipient,
	groups = [],
	onSelect,
}: ContactCardProps) {
	const recipientGroups = groups.filter((group) =>
		recipient.groupIds?.includes(group._id as Id<"groups">)
	);

	const handleCardClick = () => {
		if (onSelect) {
			onSelect(recipient._id);
		}
	};

	return (
		<Card
			className="w-full hover:shadow-lg transition-all duration-200 cursor-pointer h-full"
			isPressable
			onPress={handleCardClick}
		>
			<CardBody className="p-6">
				<div className="flex flex-col gap-4 h-full">
					{/* Header with Avatar and Name */}
					<div className="flex items-start gap-4">
						<Avatar
							src=""
							name={recipient.name}
							size="lg"
							className="flex-shrink-0"
						/>
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold text-lg truncate mb-1">
								{recipient.name}
							</h3>
							<p className="text-sm text-default-500 truncate">
								{recipient.email}
							</p>
							{recipient.metadata?.relation && (
								<div className="mt-2">
									<Chip size="sm" variant="flat" color="primary">
										{recipient.metadata.relation}
									</Chip>
								</div>
							)}
						</div>
					</div>

					{/* Details Section */}
					<div className="space-y-3 flex-1">
						<div className="flex items-center gap-3 text-default-600">
							<Calendar className="h-4 w-4 flex-shrink-0" />
							<span className="text-sm">
								{format(new Date(recipient.birthday), "MMM d, yyyy")}
							</span>
						</div>

						{recipient.metadata?.phoneNumber && (
							<div className="flex items-center gap-3 text-default-600">
								<Phone className="h-4 w-4 flex-shrink-0" />
								<span className="text-sm">
									{recipient.metadata.phoneNumber}
								</span>
							</div>
						)}

						{recipient.metadata?.address && (
							<div className="flex items-center gap-3 text-default-600">
								<MapPin className="h-4 w-4 flex-shrink-0" />
								<span className="text-sm">
									{recipient.metadata.address.city},{" "}
									{recipient.metadata.address.country}
								</span>
							</div>
						)}

						{recipient.metadata?.notes && (
							<div className="mt-3">
								<p className="text-xs text-default-500 mb-1">Notes:</p>
								<p className="text-sm text-default-700 bg-default-50 p-2 rounded text-ellipsis overflow-hidden">
									{recipient.metadata.notes.length > 100
										? `${recipient.metadata.notes.substring(0, 100)}...`
										: recipient.metadata.notes}
								</p>
							</div>
						)}
					</div>

					{/* Groups Section */}
					{recipientGroups.length > 0 && (
						<div className="flex flex-wrap gap-2 pt-2 border-t border-default-100">
							{recipientGroups.slice(0, 4).map((group) => (
								<div
									key={group._id}
									className="flex items-center gap-2 px-3 py-1.5 bg-default-100 rounded-full"
								>
									<div
										className="w-2.5 h-2.5 rounded-full flex-shrink-0"
										style={{ backgroundColor: group.color || "#6b7280" }}
									/>
									<span className="text-xs font-medium">{group.name}</span>
								</div>
							))}
							{recipientGroups.length > 4 && (
								<div className="flex items-center px-3 py-1.5 bg-default-100 rounded-full">
									<span className="text-xs text-default-500">
										+{recipientGroups.length - 4} more
									</span>
								</div>
							)}
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);
}
