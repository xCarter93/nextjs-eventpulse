"use client";

import { useState } from "react";
import { CollapsibleSidebar } from "./CollapsibleSidebar";

interface PageWithStatsProps {
	children: React.ReactNode;
}

// Move this outside the component to ensure it's only read once
const getInitialSidebarState = () => {
	if (typeof window === "undefined") return true;
	const savedState = localStorage.getItem("sidebarOpen");
	return savedState === null ? true : savedState === "true";
};

export function PageWithStats({ children }: PageWithStatsProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);

	const handleSidebarToggle = (newState: boolean) => {
		setIsSidebarOpen(newState);
		if (typeof window !== "undefined") {
			localStorage.setItem("sidebarOpen", String(newState));
		}
	};

	return (
		<div className="relative flex w-full">
			<div
				className={`
					flex-1 transition-all duration-300 ease-in-out pb-16
					${isSidebarOpen ? "lg:pr-[450px]" : "lg:pr-[60px]"}
					lg:pb-0
				`}
			>
				{children}
			</div>
			<CollapsibleSidebar
				isOpen={isSidebarOpen}
				onToggle={handleSidebarToggle}
			/>
		</div>
	);
}
