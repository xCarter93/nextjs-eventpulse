"use client";

import { BarChart3, Calendar, Zap } from "lucide-react";
import { Tooltip } from "@heroui/react";

interface SidebarIconsProps {
	onIconClick: (content: "stats" | "events" | "actions") => void;
}

export function SidebarIcons({ onIconClick }: SidebarIconsProps) {
	return (
		<>
			<Tooltip content="User Stats" placement="left">
				<div
					className="p-2 rounded-lg hover:bg-default-100 cursor-pointer"
					onClick={() => onIconClick("stats")}
				>
					<BarChart3 className="h-6 w-6" />
				</div>
			</Tooltip>

			<Tooltip content="Upcoming Events" placement="left">
				<div
					className="p-2 rounded-lg hover:bg-default-100 cursor-pointer"
					onClick={() => onIconClick("events")}
				>
					<Calendar className="h-6 w-6" />
				</div>
			</Tooltip>

			<Tooltip content="Quick Actions" placement="left">
				<div
					className="p-2 rounded-lg hover:bg-default-100 cursor-pointer"
					onClick={() => onIconClick("actions")}
				>
					<Zap className="h-6 w-6" />
				</div>
			</Tooltip>
		</>
	);
}
