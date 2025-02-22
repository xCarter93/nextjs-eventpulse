"use client";

import { BarChart2, Calendar, Bot, Zap } from "lucide-react";
import { Button } from "@heroui/react";

interface SidebarIconsProps {
	onIconClick: (content: "stats" | "events" | "actions" | "chat") => void;
}

export function SidebarIcons({ onIconClick }: SidebarIconsProps) {
	return (
		<>
			<Button
				isIconOnly
				variant="light"
				onClick={() => onIconClick("stats")}
				className="text-default-600"
			>
				<BarChart2 className="h-5 w-5" />
			</Button>
			<Button
				isIconOnly
				variant="light"
				onClick={() => onIconClick("events")}
				className="text-default-600"
			>
				<Calendar className="h-5 w-5" />
			</Button>
			<Button
				isIconOnly
				variant="light"
				onClick={() => onIconClick("actions")}
				className="text-default-600"
			>
				<Zap className="h-5 w-5" />
			</Button>
			<Button
				isIconOnly
				variant="light"
				onClick={() => onIconClick("chat")}
				className="text-default-600"
			>
				<Bot className="h-5 w-5" />
			</Button>
		</>
	);
}
