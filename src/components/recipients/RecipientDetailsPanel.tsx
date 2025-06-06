"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
	Card,
	CardBody,
	CardHeader,
	Button,
	Avatar,
	Tabs,
	Tab,
	Checkbox,
} from "@heroui/react";
import { X, Edit, Trash2, ExternalLink, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Group {
	_id: Id<"groups">;
	name: string;
	color?: string;
	description?: string;
}

interface RecipientDetailsPanelProps {
	recipientId: Id<"recipients">;
	onClose: () => void;
}

export function RecipientDetailsPanel({
	recipientId,
	onClose,
}: RecipientDetailsPanelProps) {
	const router = useRouter();
	const [selectedTab, setSelectedTab] = useState("info");
	const recipient = useQuery(api.recipients.getRecipient, { id: recipientId });
	const groupsData = useQuery(api.groups.getGroupsWithCounts);
	const addToGroup = useMutation(api.groups.addRecipientToGroup);
	const removeFromGroup = useMutation(api.groups.removeRecipientFromGroup);
	const deleteRecipient = useMutation(api.recipients.deleteRecipient);

	const handleGroupToggle = async (
		groupId: Id<"groups">,
		isChecked: boolean
	) => {
		try {
			if (isChecked) {
				await addToGroup({ recipientId, groupId });
				toast.success("Added to group");
			} else {
				await removeFromGroup({ recipientId, groupId });
				toast.success("Removed from group");
			}
		} catch (error) {
			toast.error("Failed to update group membership");
			console.error(error);
		}
	};

	const handleDelete = async () => {
		try {
			await deleteRecipient({ id: recipientId });
			toast.success("Recipient deleted successfully");
			onClose();
		} catch (error) {
			toast.error("Failed to delete recipient");
			console.error(error);
		}
	};

	const handleViewDetails = () => {
		router.push(`/recipients/${recipientId}`);
	};

	if (!recipient || !groupsData) {
		return (
			<Card className="w-80 h-fit">
				<CardBody>
					<div className="space-y-4">
						<div className="h-6 bg-default-200 rounded animate-pulse" />
						<div className="h-6 bg-default-200 rounded animate-pulse" />
						<div className="h-6 bg-default-200 rounded animate-pulse" />
					</div>
				</CardBody>
			</Card>
		);
	}

	// Type guard to ensure we have the proper structure
	if (
		!groupsData ||
		typeof groupsData !== "object" ||
		!("groups" in groupsData)
	) {
		return (
			<Card className="w-80 h-fit">
				<CardBody>
					<div className="text-center py-8">
						<p className="text-default-400">Unable to load groups</p>
					</div>
				</CardBody>
			</Card>
		);
	}

	const recipientGroups = recipient.groupIds || [];

	return (
		<Card className="w-80 h-fit">
			<CardHeader className="flex justify-between items-start pb-2">
				<div className="flex items-center gap-3 flex-1">
					<Avatar
						src=""
						name={recipient.name}
						size="md"
						className="flex-shrink-0"
					/>
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-lg truncate">{recipient.name}</h3>
						<p className="text-sm text-default-500 truncate">
							{recipient.email}
						</p>
					</div>
				</div>
				<Button
					isIconOnly
					size="sm"
					variant="light"
					onPress={onClose}
					className="flex-shrink-0"
				>
					<X className="h-4 w-4" />
				</Button>
			</CardHeader>

			<CardBody className="pt-0">
				<div className="flex gap-2 mb-4">
					<Button
						size="sm"
						variant="flat"
						color="primary"
						startContent={<Edit className="h-4 w-4" />}
						className="flex-1"
					>
						Edit
					</Button>
					<Button
						size="sm"
						variant="flat"
						color="danger"
						startContent={<Trash2 className="h-4 w-4" />}
						onPress={handleDelete}
					>
						Delete
					</Button>
				</div>

				<Tabs
					selectedKey={selectedTab}
					onSelectionChange={(key) => setSelectedTab(key as string)}
					variant="underlined"
					classNames={{
						tabList: "w-full",
						cursor: "w-full bg-primary",
						tab: "max-w-fit px-2 h-12",
					}}
				>
					<Tab key="info" title="Info">
						<div className="space-y-4 pt-4">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-default-500 mb-1">Relationship</p>
									<p className="font-medium">
										{recipient.metadata?.relation || "Not specified"}
									</p>
								</div>
								<div>
									<p className="text-default-500 mb-1">Birthday</p>
									<p className="font-medium">
										{format(new Date(recipient.birthday), "MMM d, yyyy")}
									</p>
								</div>
							</div>

							{recipient.metadata?.phoneNumber && (
								<div className="flex items-center gap-2 text-sm">
									<Phone className="h-4 w-4 text-default-400" />
									<span>{recipient.metadata.phoneNumber}</span>
								</div>
							)}

							{recipient.metadata?.address && (
								<div className="flex items-start gap-2 text-sm">
									<MapPin className="h-4 w-4 text-default-400 mt-0.5" />
									<div>
										<p>
											{recipient.metadata.address.city},{" "}
											{recipient.metadata.address.country}
										</p>
									</div>
								</div>
							)}

							{recipient.metadata?.notes && (
								<div>
									<p className="text-default-500 text-sm mb-2">Notes</p>
									<p className="text-sm bg-default-100 p-3 rounded-lg">
										{recipient.metadata.notes}
									</p>
								</div>
							)}

							<Button
								size="sm"
								variant="bordered"
								startContent={<ExternalLink className="h-4 w-4" />}
								onPress={handleViewDetails}
								className="w-full"
							>
								View Full Details
							</Button>
						</div>
					</Tab>

					<Tab key="groups" title="Groups">
						<div className="space-y-3 pt-4">
							<p className="text-sm text-default-500">
								Manage group memberships for this contact
							</p>

							<div className="space-y-2">
								{groupsData.groups.map((group: Group) => (
									<div
										key={group._id}
										className="flex items-center justify-between p-2 rounded-lg border border-default-200"
									>
										<div className="flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{ backgroundColor: group.color || "#6b7280" }}
											/>
											<span className="text-sm font-medium">{group.name}</span>
										</div>
										<Checkbox
											isSelected={recipientGroups.includes(
												group._id as Id<"groups">
											)}
											onValueChange={(isChecked) =>
												handleGroupToggle(group._id as Id<"groups">, isChecked)
											}
											size="sm"
										/>
									</div>
								))}
							</div>

							{groupsData.groups.length === 0 && (
								<p className="text-sm text-default-400 text-center py-4">
									No groups created yet. Create a group to organize your
									contacts.
								</p>
							)}
						</div>
					</Tab>

					<Tab key="history" title="History">
						<div className="space-y-3 pt-4">
							<p className="text-sm text-default-500">
								Contact activity and history
							</p>

							<div className="space-y-3">
								<div className="flex items-start gap-3 p-3 bg-default-50 rounded-lg">
									<div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
									<div className="flex-1">
										<p className="text-sm font-medium">Contact Added</p>
										<p className="text-xs text-default-500">
											{format(
												new Date(recipient._creationTime),
												"MMM d, yyyy 'at' h:mm a"
											)}
										</p>
									</div>
								</div>

								{recipient.metadata?.anniversaryDate && (
									<div className="flex items-start gap-3 p-3 bg-default-50 rounded-lg">
										<div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
										<div className="flex-1">
											<p className="text-sm font-medium">Anniversary Set</p>
											<p className="text-xs text-default-500">
												{format(
													new Date(recipient.metadata.anniversaryDate),
													"MMM d, yyyy"
												)}
											</p>
										</div>
									</div>
								)}
							</div>

							<div className="text-center py-4">
								<p className="text-xs text-default-400">
									More history features coming soon
								</p>
							</div>
						</div>
					</Tab>
				</Tabs>
			</CardBody>
		</Card>
	);
}
