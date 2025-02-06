"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EventPulseLogo() {
	const ekg =
		"M0,20 L10,20 L12,10 L22,30 L32,20 L42,20 L44,10 L54,30 L64,20 L74,20 L76,10 L86,30 L96,20 L100,20";

	return (
		<div className="flex items-center space-x-4">
			<div className="relative w-24 h-24 flex items-center justify-center bg-primary rounded-full overflow-hidden">
				{/* EKG Line */}
				<svg
					className="absolute w-full h-1/2 top-1/4"
					viewBox="0 0 100 40"
					preserveAspectRatio="none"
				>
					<motion.path
						d={ekg}
						fill="none"
						stroke="hsl(var(--primary-foreground))"
						strokeWidth="2"
						strokeLinecap="round"
						initial={{ pathLength: 0, pathOffset: 0 }}
						animate={{
							pathLength: 1,
							pathOffset: 1,
						}}
						transition={{
							duration: 6, // Slowed down from 4 to 6 seconds
							ease: "linear",
							repeat: Number.POSITIVE_INFINITY,
						}}
					/>
				</svg>

				{/* Calendar Icon with Pulsing Effect */}
				<motion.div
					className="relative z-10"
					animate={{
						scale: [1, 1.1, 1],
					}}
					transition={{
						duration: 1.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				>
					<Calendar className="w-12 h-12 text-primary-foreground" />
				</motion.div>

				{/* Radiating circles */}
				{[1, 2, 3].map((index) => (
					<motion.div
						key={index}
						className={cn(
							"absolute w-full h-full rounded-full border",
							"border-primary-foreground/30"
						)}
						initial={{ scale: 0.5, opacity: 0.7 }}
						animate={{
							scale: [0.5, 1.5],
							opacity: [0.7, 0],
						}}
						transition={{
							duration: 2,
							repeat: Number.POSITIVE_INFINITY,
							delay: index * 0.4,
							ease: "easeOut",
						}}
					/>
				))}
			</div>

			{/* Text */}
			<motion.div
				className="text-5xl font-bold text-foreground dark:text-foreground"
				initial={{ opacity: 0, x: -10 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: 0.5, duration: 0.5 }}
			>
				EventPulse
			</motion.div>
		</div>
	);
}
