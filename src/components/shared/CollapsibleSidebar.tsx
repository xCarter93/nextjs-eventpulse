"use client";

import { Button } from "@heroui/react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { UserStats } from "@/components/dashboard/UserStats";
import { SidebarIcons } from "./SidebarIcons";
import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { QuickActions } from "@/components/dashboard/QuickActions";

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

	const handleIconClick = (content: ActiveContent) => {
		setActiveContent(content);

		// For desktop, expand the sidebar
		if (window.innerWidth >= 1024) {
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
				return <UserStats />;
			case "events":
				return <UpcomingEvents />;
			case "actions":
				return <QuickActions />;
			default:
				return null;
		}
	};

	const getSidebarContent = () => {
		if (!isOpen) {
			return (
				<div className="flex flex-col items-center space-y-6 pt-12">
					<SidebarIcons onIconClick={handleIconClick} />
				</div>
			);
		}

		return (
			<div className="space-y-6">
				<UserStats />
				<UpcomingEvents />
				<QuickActions />
			</div>
		);
	};

	return (
		<>
			{/* Desktop Sidebar */}
			<div
				className={`
					fixed right-0 top-[65px] bottom-0 
					bg-background
					transition-all duration-300 ease-in-out
					hidden lg:block
					${isOpen ? "w-[450px] mr-8" : "w-[60px]"}
				`}
			>
				<Button
					isIconOnly
					variant="light"
					className="absolute -left-4 top-4 z-10"
					onClick={() => onToggle(!isOpen)}
				>
					{isOpen ? (
						<ChevronRight className="h-4 w-4" />
					) : (
						<ChevronLeft className="h-4 w-4" />
					)}
				</Button>

				<div className="h-full overflow-y-auto p-4">{getSidebarContent()}</div>
			</div>

			{/* Mobile Footer Bar */}
			<div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t border-divider">
				<div className="flex justify-around items-center py-2">
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
			>
				<ModalContent>
					<ModalHeader>
						<h3 className="text-lg font-semibold">{getModalTitle()}</h3>
					</ModalHeader>
					<ModalBody>
						<div className="p-4">{getModalContent()}</div>
					</ModalBody>
				</ModalContent>
			</Modal>
		</>
	);
}
