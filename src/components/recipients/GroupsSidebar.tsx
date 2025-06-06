"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
	Card,
	CardBody,
	Button,
	Chip,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Input,
	Textarea,
	useDisclosure,
} from "@heroui/react";
import { Users, MoreVertical, Edit, Trash2, Palette, Plus } from "lucide-react";
import { toast } from "sonner";

interface Group {
	_id: Id<"groups"> | string;
	name: string;
	count: number;
	color?: string;
	description?: string;
}

interface GroupsSidebarProps {
	selectedGroupId?: string;
	onGroupSelect: (groupId: string) => void;
	className?: string;
}

export interface GroupsSidebarRef {
	openNewGroupModal: () => void;
}

const predefinedColors = [
	"#3b82f6", // blue
	"#10b981", // green
	"#8b5cf6", // purple
	"#f59e0b", // yellow
	"#ef4444", // red
	"#6b7280", // gray
];

export const GroupsSidebar = forwardRef<GroupsSidebarRef, GroupsSidebarProps>(
	({ selectedGroupId, onGroupSelect, className }, ref) => {
		const [editingGroup, setEditingGroup] = useState<Group | null>(null);
		const [newGroupData, setNewGroupData] = useState({
			name: "",
			description: "",
			color: predefinedColors[0],
		});

		const { isOpen, onOpen, onClose } = useDisclosure();
		const {
			isOpen: isNewGroupOpen,
			onOpen: onNewGroupOpen,
			onClose: onNewGroupClose,
		} = useDisclosure();

		const groupsData = useQuery(api.groups.getGroupsWithCounts);
		const updateGroup = useMutation(api.groups.updateGroup);
		const deleteGroup = useMutation(api.groups.deleteGroup);
		const createGroup = useMutation(api.groups.createGroup);

		const handleEditGroup = (group: Group) => {
			setEditingGroup(group);
			setNewGroupData({
				name: group.name,
				description: group.description || "",
				color: group.color || predefinedColors[0],
			});
			onOpen();
		};

		const handleDeleteGroup = async (groupId: Id<"groups">) => {
			try {
				await deleteGroup({ id: groupId });
				toast.success("Group deleted successfully");
			} catch (error) {
				toast.error("Failed to delete group");
				console.error(error);
			}
		};

		const handleSaveGroup = async () => {
			try {
				if (
					editingGroup &&
					editingGroup._id !== "all" &&
					editingGroup._id !== "ungrouped"
				) {
					await updateGroup({
						id: editingGroup._id as Id<"groups">,
						name: newGroupData.name,
						description: newGroupData.description,
						color: newGroupData.color,
					});
					toast.success("Group updated successfully");
				}
				onClose();
				setEditingGroup(null);
			} catch (error) {
				toast.error("Failed to update group");
				console.error(error);
			}
		};

		const handleCreateGroup = async () => {
			try {
				await createGroup({
					name: newGroupData.name,
					description: newGroupData.description,
					color: newGroupData.color,
				});
				toast.success("Group created successfully");
				onNewGroupClose();
				setNewGroupData({
					name: "",
					description: "",
					color: predefinedColors[0],
				});
			} catch (error) {
				toast.error("Failed to create group");
				console.error(error);
			}
		};

		const openNewGroupModal = () => {
			setNewGroupData({
				name: "",
				description: "",
				color: predefinedColors[0],
			});
			onNewGroupOpen();
		};

		useImperativeHandle(ref, () => ({
			openNewGroupModal,
		}));

		if (!groupsData) {
			return (
				<Card className={className}>
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
			!("allRecipients" in groupsData)
		) {
			return (
				<Card className={className}>
					<CardBody>
						<div className="text-center py-8">
							<p className="text-default-400">Unable to load groups</p>
						</div>
					</CardBody>
				</Card>
			);
		}

		const allGroups = [
			groupsData.allRecipients,
			groupsData.ungrouped,
			...groupsData.groups,
		];

		return (
			<>
				<Card className={className}>
					<CardBody className="p-4">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold">Groups</h3>
							<Button
								size="sm"
								color="primary"
								variant="flat"
								onPress={openNewGroupModal}
								startContent={<Plus className="h-4 w-4" />}
							>
								New
							</Button>
						</div>

						<div className="space-y-2">
							{allGroups.map((group) => (
								<div
									key={group._id}
									className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
										selectedGroupId === group._id
											? "bg-primary/10 border border-primary/20"
											: "hover:bg-default-100"
									}`}
									onClick={() => onGroupSelect(group._id as string)}
								>
									<div className="flex items-center gap-3 flex-1">
										<div
											className="w-3 h-3 rounded-full flex-shrink-0"
											style={{ backgroundColor: group.color || "#6b7280" }}
										/>
										<div className="flex items-center gap-2 flex-1 min-w-0">
											{group._id === "all" ? (
												<Users className="h-4 w-4 text-default-500 flex-shrink-0" />
											) : null}
											<span className="text-sm font-medium truncate">
												{group.name}
											</span>
										</div>
										<Chip size="sm" variant="flat" color="default">
											{group.count}
										</Chip>
									</div>

									{group._id !== "all" && group._id !== "ungrouped" && (
										<Dropdown>
											<DropdownTrigger>
												<Button
													isIconOnly
													size="sm"
													variant="light"
													className="min-w-unit-6 w-6 h-6"
													onClick={(e) => e.stopPropagation()}
												>
													<MoreVertical className="h-3 w-3" />
												</Button>
											</DropdownTrigger>
											<DropdownMenu aria-label="Group actions">
												<DropdownItem
													key="edit"
													startContent={<Edit className="h-4 w-4" />}
													onPress={() => handleEditGroup(group)}
												>
													Rename
												</DropdownItem>
												<DropdownItem
													key="color"
													startContent={<Palette className="h-4 w-4" />}
													onPress={() => handleEditGroup(group)}
												>
													Change color
												</DropdownItem>
												<DropdownItem
													key="delete"
													className="text-danger"
													color="danger"
													startContent={<Trash2 className="h-4 w-4" />}
													onPress={() =>
														handleDeleteGroup(group._id as Id<"groups">)
													}
												>
													Delete Group
												</DropdownItem>
											</DropdownMenu>
										</Dropdown>
									)}
								</div>
							))}
						</div>
					</CardBody>
				</Card>

				{/* Edit Group Modal */}
				<Modal isOpen={isOpen} onClose={onClose}>
					<ModalContent>
						<ModalHeader className="flex flex-col gap-1">
							Edit Group
						</ModalHeader>
						<ModalBody>
							<Input
								label="Group Name"
								value={newGroupData.name}
								onChange={(e) =>
									setNewGroupData({ ...newGroupData, name: e.target.value })
								}
							/>
							<Textarea
								label="Description (optional)"
								value={newGroupData.description}
								onChange={(e) =>
									setNewGroupData({
										...newGroupData,
										description: e.target.value,
									})
								}
							/>
							<div>
								<label className="text-sm font-medium mb-2 block">Color</label>
								<div className="flex gap-2">
									{predefinedColors.map((color) => (
										<button
											key={color}
											type="button"
											className={`w-8 h-8 rounded-full border-2 ${
												newGroupData.color === color
													? "border-default-800"
													: "border-default-200"
											}`}
											style={{ backgroundColor: color }}
											onClick={() =>
												setNewGroupData({ ...newGroupData, color })
											}
										/>
									))}
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color="danger" variant="light" onPress={onClose}>
								Cancel
							</Button>
							<Button color="primary" onPress={handleSaveGroup}>
								Save Changes
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>

				{/* New Group Modal */}
				<Modal isOpen={isNewGroupOpen} onClose={onNewGroupClose}>
					<ModalContent>
						<ModalHeader className="flex flex-col gap-1">
							Create New Group
						</ModalHeader>
						<ModalBody>
							<Input
								label="Group Name"
								value={newGroupData.name}
								onChange={(e) =>
									setNewGroupData({ ...newGroupData, name: e.target.value })
								}
							/>
							<Textarea
								label="Description (optional)"
								value={newGroupData.description}
								onChange={(e) =>
									setNewGroupData({
										...newGroupData,
										description: e.target.value,
									})
								}
							/>
							<div>
								<label className="text-sm font-medium mb-2 block">Color</label>
								<div className="flex gap-2">
									{predefinedColors.map((color) => (
										<button
											key={color}
											type="button"
											className={`w-8 h-8 rounded-full border-2 ${
												newGroupData.color === color
													? "border-default-800"
													: "border-default-200"
											}`}
											style={{ backgroundColor: color }}
											onClick={() =>
												setNewGroupData({ ...newGroupData, color })
											}
										/>
									))}
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color="danger" variant="light" onPress={onNewGroupClose}>
								Cancel
							</Button>
							<Button
								color="primary"
								onPress={handleCreateGroup}
								isDisabled={!newGroupData.name.trim()}
							>
								Create Group
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			</>
		);
	}
);

GroupsSidebar.displayName = "GroupsSidebar";
