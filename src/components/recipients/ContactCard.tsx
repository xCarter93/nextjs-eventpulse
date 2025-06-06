"use client";

import { Card, CardBody, Avatar, Chip, Button } from "@heroui/react";
import { Phone, MapPin, Calendar, Eye } from "lucide-react";
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
			className="w-full hover:shadow-md transition-shadow cursor-pointer"
			isPressable
			onPress={handleCardClick}
		>
			<CardBody className="p-4">
				<div className="flex items-start gap-3">
					<Avatar
						src=""
						name={recipient.name}
						size="md"
						className="flex-shrink-0"
					/>
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between mb-2">
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold text-base truncate">
									{recipient.name}
								</h3>
								<p className="text-sm text-default-500 truncate">
									{recipient.email}
								</p>
							</div>
							<Button
								isIconOnly
								size="sm"
								variant="light"
								className="flex-shrink-0"
								onPress={() => handleCardClick()}
							>
								<Eye className="h-4 w-4" />
							</Button>
						</div>

						<div className="space-y-2 text-sm">
							<div className="flex items-center gap-2 text-default-600">
								<Calendar className="h-3 w-3 flex-shrink-0" />
								<span className="truncate">
									{format(new Date(recipient.birthday), "MMM d, yyyy")}
								</span>
							</div>

							{recipient.metadata?.relation && (
								<div className="flex items-center gap-2">
									<Chip size="sm" variant="flat" color="default">
										{recipient.metadata.relation}
									</Chip>
								</div>
							)}

							{recipient.metadata?.phoneNumber && (
								<div className="flex items-center gap-2 text-default-600">
									<Phone className="h-3 w-3 flex-shrink-0" />
									<span className="text-xs truncate">
										{recipient.metadata.phoneNumber}
									</span>
								</div>
							)}

							{recipient.metadata?.address && (
								<div className="flex items-center gap-2 text-default-600">
									<MapPin className="h-3 w-3 flex-shrink-0" />
									<span className="text-xs truncate">
										{recipient.metadata.address.city},{" "}
										{recipient.metadata.address.country}
									</span>
								</div>
							)}
						</div>

						{recipientGroups.length > 0 && (
							<div className="flex flex-wrap gap-1 mt-3">
								{recipientGroups.slice(0, 3).map((group) => (
									<div
										key={group._id}
										className="flex items-center gap-1 px-2 py-1 bg-default-100 rounded-full"
									>
										<div
											className="w-2 h-2 rounded-full flex-shrink-0"
											style={{ backgroundColor: group.color || "#6b7280" }}
										/>
										<span className="text-xs font-medium truncate max-w-16">
											{group.name}
										</span>
									</div>
								))}
								{recipientGroups.length > 3 && (
									<div className="flex items-center px-2 py-1 bg-default-100 rounded-full">
										<span className="text-xs text-default-500">
											+{recipientGroups.length - 3}
										</span>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</CardBody>
		</Card>
	);
}
