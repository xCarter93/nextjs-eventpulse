"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { forwardRef, RefObject, useEffect, useId, useState } from "react";
import { Mail } from "lucide-react";

export interface AnimatedBeamProps {
	className?: string;
	containerRef: RefObject<HTMLDivElement | null>;
	fromRef: RefObject<HTMLDivElement | null>;
	toRef: RefObject<HTMLDivElement | null>;
	reverse?: boolean;
	pathColor?: string;
	pathWidth?: number;
	pathOpacity?: number;
	gradientStartColor?: string;
	gradientStopColor?: string;
	delay?: number;
	duration?: number;
	dotted?: boolean;
	dotSpacing?: number;
	showEmailIcon?: boolean;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
	className,
	containerRef,
	fromRef,
	toRef,
	reverse = false,
	duration = Math.random() * 3 + 4,
	delay = 0,
	pathColor = "gray",
	pathWidth = 2,
	pathOpacity = 0.2,
	gradientStartColor,
	gradientStopColor,
	dotted = false,
	dotSpacing = 6,
	showEmailIcon = false,
}) => {
	const id = useId();
	const [pathD, setPathD] = useState("");
	const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
	const strokeDasharray = dotted ? `${dotSpacing} ${dotSpacing}` : "none";
	const gradientCoordinates = reverse
		? {
				x1: ["90%", "-10%"],
				x2: ["100%", "0%"],
				y1: ["0%", "0%"],
				y2: ["0%", "0%"],
			}
		: {
				x1: ["10%", "110%"],
				x2: ["0%", "100%"],
				y1: ["0%", "0%"],
				y2: ["0%", "0%"],
			};

	useEffect(() => {
		const updatePath = () => {
			if (containerRef.current && fromRef.current && toRef.current) {
				const containerRect = containerRef.current.getBoundingClientRect();
				const fromRect = fromRef.current.getBoundingClientRect();
				const toRect = toRef.current.getBoundingClientRect();

				const svgWidth = containerRect.width;
				const svgHeight = containerRect.height;
				setSvgDimensions({ width: svgWidth, height: svgHeight });

				// Calculate the center of the circles relative to the container
				const fromCenterX =
					fromRect.left - containerRect.left + fromRect.width / 2;
				const toCenterX = toRect.left - containerRect.left + toRect.width / 2;

				// Calculate the vertical center of both circles
				const fromCenterY =
					fromRect.top - containerRect.top + fromRect.height / 2;
				const toCenterY = toRect.top - containerRect.top + toRect.height / 2;
				const centerY = (fromCenterY + toCenterY) / 2;

				// Calculate the start and end points considering circle radius
				const radius = fromRect.width / 2; // Assuming circles are the same size
				const startX = fromCenterX + radius; // Start from right edge of left circle
				const endX = toCenterX - radius; // End at left edge of right circle

				// Create the path
				const d = `M ${startX},${centerY} L ${endX},${centerY}`;
				setPathD(d);

				// Store the path length for the email animation
				const pathLength = endX - startX;
				setAnimationDistance(pathLength);
			}
		};

		const resizeObserver = new ResizeObserver(() => {
			updatePath();
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		updatePath();

		return () => {
			resizeObserver.disconnect();
		};
	}, [containerRef, fromRef, toRef]);

	const [animationDistance, setAnimationDistance] = useState(0);

	return (
		<svg
			fill="none"
			width={svgDimensions.width}
			height={svgDimensions.height}
			xmlns="http://www.w3.org/2000/svg"
			className={cn(
				"pointer-events-none absolute left-0 top-0 transform-gpu stroke-2",
				className
			)}
			viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
		>
			<path
				d={pathD}
				stroke={pathColor}
				strokeWidth={pathWidth}
				strokeOpacity={pathOpacity}
				strokeLinecap="round"
				strokeDasharray={strokeDasharray}
			/>
			{gradientStartColor && gradientStopColor && (
				<motion.path
					d={pathD}
					stroke={`url(#${id})`}
					strokeLinecap="round"
					strokeDasharray={strokeDasharray}
					initial={{
						strokeWidth: pathWidth,
						strokeOpacity: 0,
					}}
					animate={{
						strokeWidth: pathWidth * 1.5,
						strokeOpacity: 1,
					}}
					transition={{
						duration: 2,
						delay: delay,
					}}
				/>
			)}
			{showEmailIcon && (
				<motion.g
					initial={{ x: 0, opacity: 0 }}
					animate={{
						x: animationDistance,
						opacity: [0, 1, 1, 0],
					}}
					transition={{
						x: {
							duration: duration * 0.8, // Make email slightly faster than beam
							delay: delay,
							repeat: Infinity,
							repeatDelay: 0,
							ease: "linear",
						},
						opacity: {
							duration: duration * 0.8,
							delay: delay,
							repeat: Infinity,
							repeatDelay: 0,
							times: [0, 0.1, 0.8, 1],
						},
					}}
				>
					<Mail
						className="w-4 h-4 text-orange-500"
						style={{
							transformOrigin: "center",
							transform: "translateY(-12px)",
						}}
					/>
				</motion.g>
			)}
			{gradientStartColor && gradientStopColor && (
				<defs>
					<motion.linearGradient
						className="transform-gpu"
						id={id}
						gradientUnits={"userSpaceOnUse"}
						initial={{
							x1: "0%",
							x2: "0%",
							y1: "0%",
							y2: "0%",
						}}
						animate={{
							x1: gradientCoordinates.x1,
							x2: gradientCoordinates.x2,
							y1: gradientCoordinates.y1,
							y2: gradientCoordinates.y2,
						}}
						transition={{
							delay,
							duration,
							ease: [0.16, 1, 0.3, 1],
							repeat: Infinity,
							repeatDelay: 0,
						}}
					>
						<stop stopColor={gradientStartColor} stopOpacity="0"></stop>
						<stop stopColor={gradientStartColor}></stop>
						<stop offset="32.5%" stopColor={gradientStopColor}></stop>
						<stop
							offset="100%"
							stopColor={gradientStopColor}
							stopOpacity="0"
						></stop>
					</motion.linearGradient>
				</defs>
			)}
		</svg>
	);
};

export const Circle = forwardRef<
	HTMLDivElement,
	{ className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
	return (
		<div
			ref={ref}
			className={cn(
				"z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white p-0 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
				className
			)}
		>
			{children}
		</div>
	);
});

Circle.displayName = "Circle";
