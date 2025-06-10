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
					hidden lg:grid w-full min-h-full
					transition-all duration-300 ease-in-out
					${
						isSidebarOpen
							? "lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px] gap-8 xl:gap-12"
							: "lg:grid-cols-[1fr_70px] gap-6"
					}
				`}
				style={{
					gridTemplateAreas: '"main sidebar"',
				}}
			>
				<div className="pr-4 px-2 py-4" style={{ gridArea: "main" }}>
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
			<div className="lg:hidden w-full pb-16 px-2 py-4">
				{children}
				<CollapsibleSidebar
					isOpen={isSidebarOpen}
					onToggle={handleSidebarToggle}
				/>
			</div>
		</div>
	);
}
