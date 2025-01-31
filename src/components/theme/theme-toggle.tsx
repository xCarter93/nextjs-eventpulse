"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

const TOGGLE_CLASSES =
	"relative z-10 flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	// Prevent hydration mismatch
	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<div className="relative flex w-fit items-center rounded-full border bg-muted/50">
			<button
				className={`${TOGGLE_CLASSES} ${
					theme === "light"
						? "text-primary-foreground"
						: "text-muted-foreground hover:text-foreground"
				}`}
				onClick={() => setTheme("light")}
			>
				<Sun className="relative z-10 h-4 w-4" />
				<span className="relative z-10 hidden md:inline-block">Light</span>
			</button>
			<button
				className={`${TOGGLE_CLASSES} ${
					theme === "dark"
						? "text-primary-foreground"
						: "text-muted-foreground hover:text-foreground"
				}`}
				onClick={() => setTheme("dark")}
			>
				<Moon className="relative z-10 h-4 w-4" />
				<span className="relative z-10 hidden md:inline-block">Dark</span>
			</button>
			<div
				className={`absolute inset-0 z-0 flex ${
					theme === "dark" ? "justify-end" : "justify-start"
				}`}
			>
				<motion.span
					layout
					transition={{ type: "spring", damping: 15, stiffness: 250 }}
					className="h-full w-1/2 rounded-full bg-primary"
				/>
			</div>
		</div>
	);
}
