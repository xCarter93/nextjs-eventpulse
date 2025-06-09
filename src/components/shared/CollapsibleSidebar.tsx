"use client";

import { Button } from "@heroui/react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { UserStats } from "@/components/dashboard/UserStats";
import { SidebarIcons } from "./SidebarIcons";
import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useSidebarAccordionState } from "@/hooks/useSidebarAccordionState";

interface CollapsibleSidebarProps {
	isOpen: boolean;
	onToggle: (isOpen: boolean) => void;
}

type ActiveContent = "stats" | "events" | "actions" | null;

export function CollapsibleSidebar({
	isOpen,
	onToggle,
}: CollapsibleSidebarProps) {
	const [activeContent, setActiveContent] = useState<ActiveContent>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { updateAccordionState, getAccordionState, isLoaded } =
		useSidebarAccordionState();

	const handleIconClick = (content: ActiveContent) => {
		setActiveContent(content);

		// For desktop/tablet, expand the sidebar
		if (window.innerWidth >= 768) {
			onToggle(true);
			return;
		}

		// On mobile, open the modal
		setIsModalOpen(true);
	};

	const getModalTitle = () => {
		switch (activeContent) {
			case "stats":
				return "User Stats";
			case "events":
				return "Upcoming Events";
			case "actions":
				return "Quick Actions";
			default:
				return "";
		}
	};

	const getModalContent = () => {
		switch (activeContent) {
			case "stats":
				return (
					<UserStats
						selectedKeys={getAccordionState("userStats")}
						onSelectionChange={(keys) =>
							updateAccordionState("userStats", keys)
						}
					/>
				);
			case "events":
				return (
					<UpcomingEvents
						selectedKeys={getAccordionState("upcomingEvents")}
						onSelectionChange={(keys) =>
							updateAccordionState("upcomingEvents", keys)
						}
					/>
				);
			case "actions":
				return (
					<QuickActions
						selectedKeys={getAccordionState("quickActions")}
						onSelectionChange={(keys) =>
							updateAccordionState("quickActions", keys)
						}
					/>
				);
			default:
				return null;
		}
	};

	const getSidebarContent = () => {
		if (!isOpen) {
			return (
				<div className="flex flex-col items-center space-y-8 pt-8">
					<SidebarIcons onIconClick={handleIconClick} />
				</div>
			);
		}

		// Don't render the accordion components until the state is loaded
		if (!isLoaded) {
			return (
				<div className="space-y-6 mt-4">
					<div className="animate-pulse space-y-4">
						<div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
						<div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
						<div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
					</div>
				</div>
			);
		}

		return (
			<div className="space-y-6 mt-4">
				<UserStats
					selectedKeys={getAccordionState("userStats")}
					onSelectionChange={(keys) => updateAccordionState("userStats", keys)}
				/>
				<UpcomingEvents
					selectedKeys={getAccordionState("upcomingEvents")}
					onSelectionChange={(keys) =>
						updateAccordionState("upcomingEvents", keys)
					}
				/>
				<QuickActions
					selectedKeys={getAccordionState("quickActions")}
					onSelectionChange={(keys) =>
						updateAccordionState("quickActions", keys)
					}
				/>
			</div>
		);
	};

	return (
		<>
			{/* Desktop Sidebar - Now uses relative positioning within grid */}
			<div
				className={`
					h-full
					transition-all duration-300 ease-in-out
					hidden md:flex md:flex-col
					relative
				`}
			>
				<Button
					isIconOnly
					variant="flat"
					className="absolute -left-4 top-2 z-10 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-200"
					onPress={() => onToggle(!isOpen)}
				>
					{isOpen ? (
						<ChevronRight className="h-4 w-4" />
					) : (
						<ChevronLeft className="h-4 w-4" />
					)}
				</Button>

				<div className="flex-1 overflow-y-auto px-2 pb-4">
					{getSidebarContent()}
				</div>
			</div>

			{/* Mobile Footer Bar */}
			<div className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur-sm border-t border-divider z-50">
				<div className="flex justify-around items-center py-2 px-4 safe-area-pb">
					<SidebarIcons onIconClick={handleIconClick} />
				</div>
			</div>

			{/* Mobile Modal */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setActiveContent(null);
				}}
				size="2xl"
				scrollBehavior="inside"
			>
				<ModalContent>
					<ModalHeader>
						<h3 className="text-lg font-semibold">{getModalTitle()}</h3>
					</ModalHeader>
					<ModalBody className="pb-6">{getModalContent()}</ModalBody>
				</ModalContent>
			</Modal>
		</>
	);
}
