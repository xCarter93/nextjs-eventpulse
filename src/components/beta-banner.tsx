"use client";

import { Alert } from "@heroui/alert";
import { AlertTriangle } from "lucide-react";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const BetaBanner = () => {
	const betaFlagEnabled = useFeatureFlagEnabled("beta-banner");
	const [isExpanded, setIsExpanded] = useState(false);

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsExpanded((prev) => !prev);
	};

	if (!betaFlagEnabled) return null;

	const contentVariants = {
		expanded: {
			width: "100%",
			x: 0,
			opacity: 1,
			transition: {
				duration: 0.4,
				ease: "easeInOut",
				opacity: { duration: 0.3 },
			},
		},
		collapsed: {
			width: "auto",
			x: 0,
			opacity: 1,
			transition: {
				duration: 0.4,
				ease: "easeInOut",
				opacity: { duration: 0.3 },
			},
		},
		exitExpanded: {
			width: "auto",
			x: 20,
			opacity: 0,
			transition: {
				duration: 0.4,
				ease: "easeInOut",
				opacity: { duration: 0.3 },
			},
		},
		exitCollapsed: {
			width: "auto",
			x: -20,
			opacity: 0,
			transition: {
				duration: 0.4,
				ease: "easeInOut",
				opacity: { duration: 0.3 },
			},
		},
	};

	return (
		<div className="relative w-full flex justify-center">
			<motion.div
				className="relative"
				initial={false}
				animate={{
					width: isExpanded ? "100%" : "auto",
					maxWidth: isExpanded ? "56rem" : "auto",
				}}
				transition={{
					duration: 0.4,
					ease: "easeInOut",
				}}
			>
				<div className="absolute inset-0 rounded-full animate-gradient"></div>
				<div className="cursor-pointer" onClick={handleClick}>
					<Alert
						className="relative z-10 bg-warning-100/80 overflow-hidden text-sm py-1.5"
						color="warning"
						icon={<AlertTriangle className="h-3.5 w-3.5" />}
						variant="faded"
						radius="full"
					>
						<AnimatePresence initial={false} mode="wait">
							{!isExpanded ? (
								<motion.div
									key="collapsed"
									initial="exitExpanded"
									animate="collapsed"
									exit="exitCollapsed"
									variants={contentVariants}
									className="flex items-center whitespace-nowrap"
								>
									<span className="font-medium">Beta Version</span>
								</motion.div>
							) : (
								<motion.div
									key="expanded"
									initial="exitCollapsed"
									animate="expanded"
									exit="exitExpanded"
									variants={contentVariants}
									className="flex items-center gap-4 w-full"
								>
									<span className="whitespace-nowrap">
										This site is currently in beta and subject to frequent
										updates.
									</span>
									<span className="whitespace-nowrap">
										Have feedback? Contact us at{" "}
										<a
											href="mailto:pulse@eventpulse.tech"
											className="font-medium underline hover:text-warning-800"
											onClick={(e) => e.stopPropagation()}
										>
											pulse@eventpulse.tech
										</a>
									</span>
								</motion.div>
							)}
						</AnimatePresence>
					</Alert>
				</div>
			</motion.div>
		</div>
	);
};
