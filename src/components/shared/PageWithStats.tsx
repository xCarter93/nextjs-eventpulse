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
		<div className="relative w-full h-full">
			{/* Desktop Grid Layout */}
			<div
				className={`
					hidden md:grid w-full min-h-full
					transition-all duration-300 ease-in-out
					${
						isSidebarOpen
							? "md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_400px] gap-4 lg:gap-6"
							: "md:grid-cols-[1fr_70px] gap-3"
					}
				`}
				style={{
					gridTemplateAreas: '"main sidebar"',
				}}
			>
				<div className="overflow-hidden pr-2" style={{ gridArea: "main" }}>
					{children}
				</div>
				<div className="flex-shrink-0" style={{ gridArea: "sidebar" }}>
					<CollapsibleSidebar
						isOpen={isSidebarOpen}
						onToggle={handleSidebarToggle}
					/>
				</div>
			</div>

			{/* Mobile Layout */}
			<div className="md:hidden w-full pb-16">
				{children}
				<CollapsibleSidebar
					isOpen={isSidebarOpen}
					onToggle={handleSidebarToggle}
				/>
			</div>
		</div>
	);
}
