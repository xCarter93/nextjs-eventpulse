"use client";

import { useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import DottedMap from "dotted-map";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

export function DottedMapComponent() {
	const svgRef = useRef<SVGSVGElement>(null);
	const { theme } = useTheme();

	// Fetch recipients data
	const recipients = useQuery(api.recipients.getRecipients);

	// Memoize the SVG to prevent recreation on every render
	const svgMap = useMemo(() => {
		const map = new DottedMap({ height: 100, grid: "diagonal" });
		return map.getSVG({
			radius: 0.22,
			color: theme === "dark" ? "#FFFFFF40" : "#00000040",
			shape: "circle",
			backgroundColor: "transparent",
		});
	}, [theme]);

	if (!recipients) {
		return <Skeleton className="w-full h-[600px] rounded-lg" />;
	}

	// Filter recipients with valid coordinates and create dots array
	const dots = recipients
		.filter((recipient) => recipient.metadata?.address?.coordinates)
		.map((recipient) => ({
			start: {
				lat: recipient.metadata?.address?.coordinates?.latitude || 0,
				lng: recipient.metadata?.address?.coordinates?.longitude || 0,
				label: recipient.name,
			},
			// For this example, we'll use a central point (e.g., San Francisco) as the end point
			end: {
				lat: 37.7749,
				lng: -122.4194,
				label: "San Francisco",
			},
		}));

	if (dots.length === 0) {
		return (
			<div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/10">
				<p className="text-muted-foreground">
					No recipients with addresses found
				</p>
			</div>
		);
	}

	// Simple coordinate projection with slight vertical offset
	const projectPoint = (lat: number, lng: number) => {
		const x = (lng + 180) * (800 / 360);
		const y = (90 - lat) * (400 / 180) + 20; // Added 20px offset
		return { x, y };
	};

	const createCurvedPath = (
		start: { x: number; y: number },
		end: { x: number; y: number }
	) => {
		const midX = (start.x + end.x) / 2;
		const midY = Math.min(start.y, end.y) - 50;
		return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
	};

	return (
		<div className="w-full h-[600px] dark:bg-background/50 bg-background/50 rounded-lg border relative font-sans">
			<Image
				src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
				className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
				alt="world map"
				fill
				priority
				draggable={false}
			/>
			<svg
				ref={svgRef}
				viewBox="0 0 800 400"
				className="w-full h-full absolute inset-0 pointer-events-none select-none"
			>
				<AnimatePresence>
					{dots.map((dot, i) => {
						const startPoint = projectPoint(dot.start.lat, dot.start.lng);
						const endPoint = projectPoint(dot.end.lat, dot.end.lng);
						return (
							<g key={`path-group-${i}`}>
								<motion.path
									d={createCurvedPath(startPoint, endPoint)}
									fill="none"
									stroke="url(#path-gradient)"
									strokeWidth="1"
									initial={{ pathLength: 0, opacity: 0 }}
									animate={{ pathLength: 1, opacity: 1 }}
									transition={{
										duration: 2,
										delay: 0.2 * i,
										ease: "easeInOut",
									}}
								/>
							</g>
						);
					})}
				</AnimatePresence>

				<defs>
					<linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="white" stopOpacity="0" />
						<stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity="1" />
						<stop
							offset="95%"
							stopColor="hsl(var(--primary))"
							stopOpacity="1"
						/>
						<stop offset="100%" stopColor="white" stopOpacity="0" />
					</linearGradient>
				</defs>

				<AnimatePresence>
					{dots.map((dot, i) => (
						<g key={`points-group-${i}`}>
							<motion.g
								key={`start-${i}`}
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ delay: 0.2 * i, duration: 0.5 }}
							>
								<circle
									cx={projectPoint(dot.start.lat, dot.start.lng).x}
									cy={projectPoint(dot.start.lat, dot.start.lng).y}
									r="2"
									fill="hsl(var(--primary))"
								/>
								<circle
									cx={projectPoint(dot.start.lat, dot.start.lng).x}
									cy={projectPoint(dot.start.lat, dot.start.lng).y}
									r="2"
									fill="hsl(var(--primary))"
									opacity="0.5"
								>
									<animate
										attributeName="r"
										from="2"
										to="8"
										dur="1.5s"
										begin="0s"
										repeatCount="indefinite"
									/>
									<animate
										attributeName="opacity"
										from="0.5"
										to="0"
										dur="1.5s"
										begin="0s"
										repeatCount="indefinite"
									/>
								</circle>
							</motion.g>
							<motion.g
								key={`end-${i}`}
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ delay: 0.2 * i + 1, duration: 0.5 }}
							>
								<circle
									cx={projectPoint(dot.end.lat, dot.end.lng).x}
									cy={projectPoint(dot.end.lat, dot.end.lng).y}
									r="2"
									fill="hsl(var(--primary))"
								/>
								<circle
									cx={projectPoint(dot.end.lat, dot.end.lng).x}
									cy={projectPoint(dot.end.lat, dot.end.lng).y}
									r="2"
									fill="hsl(var(--primary))"
									opacity="0.5"
								>
									<animate
										attributeName="r"
										from="2"
										to="8"
										dur="1.5s"
										begin="0s"
										repeatCount="indefinite"
									/>
									<animate
										attributeName="opacity"
										from="0.5"
										to="0"
										dur="1.5s"
										begin="0s"
										repeatCount="indefinite"
									/>
								</circle>
							</motion.g>
						</g>
					))}
				</AnimatePresence>
			</svg>
		</div>
	);
}
