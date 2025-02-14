"use client";

import { useState } from "react";
import { CollapsibleSidebar } from "./CollapsibleSidebar";

interface PageWithSidebarProps {
	children: React.ReactNode;
}

const getInitialSidebarState = () => {
	if (typeof window === "undefined") return true;
	const savedState = localStorage.getItem("sidebarOpen");
	return savedState === null ? true : savedState === "true";
};

export function PageWithSidebar({ children }: PageWithSidebarProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);

	const handleSidebarToggle = (newState: boolean) => {
		setIsSidebarOpen(newState);
		if (typeof window !== "undefined") {
			localStorage.setItem("sidebarOpen", String(newState));
		}
	};

	return (
		<div className="relative flex w-full">
			<div className={`flex-1 transition-all duration-300`}>{children}</div>
			<CollapsibleSidebar
				isOpen={isSidebarOpen}
				onToggle={handleSidebarToggle}
			/>
		</div>
	);
}
