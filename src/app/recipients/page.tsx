"use client";

import { useState } from "react";
import { RecipientsTable } from "@/components/recipients/RecipientsTable";
import { GroupsSidebar } from "@/components/recipients/GroupsSidebar";
import { RecipientDetailsPanel } from "@/components/recipients/RecipientDetailsPanel";
import { ContactCard } from "@/components/recipients/ContactCard";
import { RecipientForm } from "@/components/recipients/RecipientForm";
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
	useDisclosure,
} from "@heroui/react";
import { Search, Plus, Users, LayoutGrid, List } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageWithStats } from "@/components/shared/PageWithStats";
import { Id } from "../../../convex/_generated/dataModel";

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

	const recipients = useQuery(api.recipients.getRecipients);
	const groupsData = useQuery(api.groups.getGroupsWithCounts);

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
		// Set selected recipient for both table and card modes
		setSelectedRecipientId(recipientId);
	};

	const handleCloseDetailsPanel = () => {
		setSelectedRecipientId(null);
	};

	const handleAddRecipient = () => {
		onRecipientModalOpen();
	};

	const handleRecipientFormSuccess = () => {
		onRecipientModalClose();
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
					<div className="flex items-center gap-3">
						<Button
							color="primary"
							startContent={<Plus className="h-4 w-4" />}
							onPress={handleAddRecipient}
						>
							Add Recipient
						</Button>
						{/* View mode toggle - only show on larger screens */}
						<div className="hidden lg:flex items-center gap-2">
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
								onPress={() => {
									setViewMode("cards");
									setSelectedRecipientId(null); // Clear selection when switching to cards
								}}
							>
								<LayoutGrid className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				{/* Large Screen Layout */}
				<div className="hidden lg:flex gap-4">
					{/* Sidebar - Large screens */}
					<div className="flex-shrink-0">
						<GroupsSidebar
							selectedGroupId={selectedGroupId}
							onGroupSelect={setSelectedGroupId}
							className="w-56 sticky top-6"
						/>
					</div>

					{/* Main Content Area */}
					<div className="flex-1 min-w-0">
						{viewMode === "table" ? (
							<div className="bg-white border-default-200 rounded-lg overflow-x-auto">
								<RecipientsTable
									onRecipientSelect={handleRecipientSelect}
									filteredRecipients={filteredRecipients}
								/>
							</div>
						) : (
							<div className="space-y-4">
								{/* Cards Grid */}
								<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-2">
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

						{/* Details Panel - Below main content on screens smaller than xl */}
						{selectedRecipientId && (
							<div className="xl:hidden mt-6">
								<RecipientDetailsPanel
									recipientId={selectedRecipientId}
									onClose={handleCloseDetailsPanel}
								/>
							</div>
						)}
					</div>

					{/* Details Panel - Right side on xl screens and above */}
					{selectedRecipientId && (
						<div className="hidden xl:block flex-shrink-0">
							<RecipientDetailsPanel
								recipientId={selectedRecipientId}
								onClose={handleCloseDetailsPanel}
							/>
						</div>
					)}
				</div>

				{/* Small Screen Layout */}
				<div className="lg:hidden space-y-6">
					{/* Groups */}
					<GroupsSidebar
						selectedGroupId={selectedGroupId}
						onGroupSelect={setSelectedGroupId}
						className="w-full"
					/>

					{/* Cards Grid - Always cards on mobile */}
					<div className="space-y-4">
						<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 p-2">
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

					{/* Details Panel - Below cards on mobile */}
					{selectedRecipientId && (
						<div className="mt-6">
							<RecipientDetailsPanel
								recipientId={selectedRecipientId}
								onClose={handleCloseDetailsPanel}
							/>
						</div>
					)}
				</div>
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
		</PageWithStats>
	);
}
