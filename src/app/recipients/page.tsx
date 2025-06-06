"use client";

import { useState, Suspense, lazy, useEffect } from "react";
import { RecipientsTable } from "@/components/recipients/RecipientsTable";
import { GroupsSidebar } from "@/components/recipients/GroupsSidebar";
import { RecipientDetailsPanel } from "@/components/recipients/RecipientDetailsPanel";
import { ContactCard } from "@/components/recipients/ContactCard";
import { RecipientForm } from "@/components/recipients/RecipientForm";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
	Input,
	Button,
	Card,
	CardBody,
	Pagination,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Textarea,
	useDisclosure,
} from "@heroui/react";
import { Search, Plus, Users, LayoutGrid, List } from "lucide-react";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageWithStats } from "@/components/shared/PageWithStats";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

// Use React.lazy instead of dynamic import
const DottedMapComponent = lazy(() =>
	import("@/components/recipients/DottedMap").then((mod) => ({
		default: mod.DottedMapComponent,
	}))
);

// Loading state component
function MapLoadingState() {
	return (
		<div className="min-h-[400px] flex items-center justify-center">
			<div className="text-center space-y-4">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
				<p className="text-sm text-muted-foreground">Loading map view...</p>
			</div>
		</div>
	);
}

// Separate data loading component
function MapContent() {
	const recipients = useQuery(api.recipients.getRecipients);
	const user = useQuery(api.users.getUser);

	if (!recipients || !user) {
		return <MapLoadingState />;
	}

	if (!user.settings?.address?.coordinates) {
		return (
			<div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/10">
				<p className="text-muted-foreground">
					Please set your address in settings to view the map
				</p>
			</div>
		);
	}

	// Wrap the actual map component in Suspense
	return (
		<Suspense fallback={<MapLoadingState />}>
			<DottedMapComponent />
		</Suspense>
	);
}

// Wrap map component with suspense for data loading
function MapWithSuspense() {
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);

	// Start preloading the map component when this component mounts
	useEffect(() => {
		if (subscriptionLevel === "pro") {
			const preloadMap = () => import("@/components/recipients/DottedMap");
			preloadMap();
		}
	}, [subscriptionLevel]);

	return (
		<Suspense fallback={<MapLoadingState />}>
			{subscriptionLevel === "pro" ? (
				<MapContent />
			) : (
				<LockedFeature featureDescription="view recipient locations on a map">
					<MapContent />
				</LockedFeature>
			)}
		</Suspense>
	);
}

export default function RecipientsPage() {
	const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
	const [selectedRecipientId, setSelectedRecipientId] =
		useState<Id<"recipients"> | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"table" | "cards">("table");
	const [currentPage, setCurrentPage] = useState(1);

	const {
		isOpen: isRecipientModalOpen,
		onOpen: onRecipientModalOpen,
		onClose: onRecipientModalClose,
	} = useDisclosure();

	const {
		isOpen: isNewGroupModalOpen,
		onOpen: onNewGroupModalOpen,
		onClose: onNewGroupModalClose,
	} = useDisclosure();

	const [newGroupData, setNewGroupData] = useState({
		name: "",
		description: "",
		color: "#3b82f6",
	});

	const recipients = useQuery(api.recipients.getRecipients);
	const groupsData = useQuery(api.groups.getGroupsWithCounts);
	const createGroup = useMutation(api.groups.createGroup);

	// Filter recipients based on selected group and search
	const filteredRecipients =
		recipients?.filter((recipient) => {
			// Filter by group
			if (selectedGroupId === "all") {
				// Show all recipients
			} else if (selectedGroupId === "ungrouped") {
				if (recipient.groupIds && recipient.groupIds.length > 0) {
					return false;
				}
			} else {
				if (!recipient.groupIds?.includes(selectedGroupId as Id<"groups">)) {
					return false;
				}
			}

			// Filter by search query
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					recipient.name.toLowerCase().includes(query) ||
					recipient.email.toLowerCase().includes(query)
				);
			}

			return true;
		}) || [];

	// Pagination for card view
	const itemsPerPage = 12;
	const totalPages = Math.ceil(filteredRecipients.length / itemsPerPage);
	const paginatedRecipients = filteredRecipients.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const handleRecipientSelect = (recipientId: Id<"recipients">) => {
		setSelectedRecipientId(recipientId);
	};

	const handleCloseDetailsPanel = () => {
		setSelectedRecipientId(null);
	};

	const handleAddRecipient = () => {
		onRecipientModalOpen();
	};

	const handleNewGroup = () => {
		setNewGroupData({
			name: "",
			description: "",
			color: "#3b82f6",
		});
		onNewGroupModalOpen();
	};

	const handleRecipientFormSuccess = () => {
		onRecipientModalClose();
	};

	const handleCreateGroup = async () => {
		try {
			await createGroup({
				name: newGroupData.name,
				description: newGroupData.description,
				color: newGroupData.color,
			});
			toast.success("Group created successfully");
			onNewGroupModalClose();
			setNewGroupData({
				name: "",
				description: "",
				color: "#3b82f6",
			});
		} catch (error) {
			toast.error("Failed to create group");
			console.error(error);
		}
	};

	return (
		<PageWithStats>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-foreground">Recipients</h1>
						<p className="mt-2 text-muted-foreground">
							Manage your recipients and their information.
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							color="primary"
							startContent={<Plus className="h-4 w-4" />}
							onPress={handleAddRecipient}
						>
							Add Recipient
						</Button>
						<Button
							variant="bordered"
							startContent={<Users className="h-4 w-4" />}
							onPress={handleNewGroup}
						>
							New Group
						</Button>
					</div>
				</div>

				{/* Search and View Controls */}
				<div className="flex items-center justify-between gap-4">
					<div className="flex-1 max-w-md">
						<Input
							placeholder="Search recipients..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							startContent={<Search className="h-4 w-4 text-default-400" />}
							classNames={{
								input: "text-sm",
								inputWrapper: "h-10",
							}}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Button
							isIconOnly
							variant={viewMode === "table" ? "solid" : "light"}
							color={viewMode === "table" ? "primary" : "default"}
							onPress={() => setViewMode("table")}
						>
							<List className="h-4 w-4" />
						</Button>
						<Button
							isIconOnly
							variant={viewMode === "cards" ? "solid" : "light"}
							color={viewMode === "cards" ? "primary" : "default"}
							onPress={() => setViewMode("cards")}
						>
							<LayoutGrid className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex gap-6">
					{/* Sidebar - Large screens */}
					<div className="hidden lg:block">
						<GroupsSidebar
							selectedGroupId={selectedGroupId}
							onGroupSelect={setSelectedGroupId}
							className="w-64 sticky top-6"
						/>
					</div>

					{/* Mobile Groups - Small screens */}
					<div className="lg:hidden w-full mb-4">
						<GroupsSidebar
							selectedGroupId={selectedGroupId}
							onGroupSelect={setSelectedGroupId}
							className="w-full"
						/>
					</div>

					{/* Main Content Area */}
					<div className="flex-1 min-w-0">
						{viewMode === "table" ? (
							<Card>
								<CardBody className="p-0">
									<RecipientsTable />
								</CardBody>
							</Card>
						) : (
							<div className="space-y-4">
								{/* Cards Grid */}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{paginatedRecipients.map((recipient) => (
										<ContactCard
											key={recipient._id}
											recipient={recipient}
											groups={
												groupsData && "groups" in groupsData
													? groupsData.groups
													: []
											}
											onSelect={handleRecipientSelect}
										/>
									))}
								</div>

								{/* Pagination */}
								{totalPages > 1 && (
									<div className="flex justify-center">
										<Pagination
											total={totalPages}
											page={currentPage}
											onChange={setCurrentPage}
											showControls
											showShadow
											color="primary"
										/>
									</div>
								)}

								{/* Empty State */}
								{filteredRecipients.length === 0 && (
									<Card>
										<CardBody className="text-center py-12">
											<Users className="h-12 w-12 text-default-300 mx-auto mb-4" />
											<h3 className="text-lg font-semibold mb-2">
												No recipients found
											</h3>
											<p className="text-default-500 mb-4">
												{searchQuery
													? "Try adjusting your search or filters"
													: "Get started by adding your first recipient"}
											</p>
											<Button
												color="primary"
												startContent={<Plus className="h-4 w-4" />}
												onPress={handleAddRecipient}
											>
												Add Recipient
											</Button>
										</CardBody>
									</Card>
								)}
							</div>
						)}
					</div>

					{/* Details Panel - Large screens only */}
					{selectedRecipientId && (
						<div className="hidden lg:block">
							<RecipientDetailsPanel
								recipientId={selectedRecipientId}
								onClose={handleCloseDetailsPanel}
							/>
						</div>
					)}
				</div>

				{/* Map View Tab - Keep for Pro feature */}
				<Tabs defaultValue="recipients" className="w-full hidden">
					<TabsContent value="dotted-map">
						<MapWithSuspense />
					</TabsContent>
				</Tabs>
			</div>

			{/* Add Recipient Modal */}
			<Modal isOpen={isRecipientModalOpen} onClose={onRecipientModalClose}>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">
						Add New Recipient
					</ModalHeader>
					<ModalBody>
						<RecipientForm onSuccess={handleRecipientFormSuccess} />
					</ModalBody>
				</ModalContent>
			</Modal>

			{/* New Group Modal */}
			<Modal isOpen={isNewGroupModalOpen} onClose={onNewGroupModalClose}>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">
						Create New Group
					</ModalHeader>
					<ModalBody>
						<div className="space-y-4">
							<Input
								label="Group Name"
								value={newGroupData.name}
								onChange={(e) =>
									setNewGroupData({ ...newGroupData, name: e.target.value })
								}
								isRequired
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
									{[
										"#3b82f6", // blue
										"#10b981", // green
										"#8b5cf6", // purple
										"#f59e0b", // yellow
										"#ef4444", // red
										"#6b7280", // gray
									].map((color) => (
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
						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							color="danger"
							variant="light"
							onPress={onNewGroupModalClose}
						>
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
		</PageWithStats>
	);
}
