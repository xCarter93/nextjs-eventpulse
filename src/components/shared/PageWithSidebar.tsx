import { ReactNode } from "react";
import { CollapsibleSidebar } from "./CollapsibleSidebar";

interface PageWithSidebarProps {
	children: ReactNode;
}

export function PageWithSidebar({ children }: PageWithSidebarProps) {
	return (
		<div className="relative flex w-full">
			<div className={`flex-1 transition-all duration-300`}>{children}</div>
			<CollapsibleSidebar />
		</div>
	);
}
