"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { forwardRef, RefObject, useEffect, useId, useState } from "react";

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
	startXOffset?: number;
	startYOffset?: number;
	endXOffset?: number;
	endYOffset?: number;
	dotted?: boolean;
	dotSpacing?: number;
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
	startXOffset = 0,
	startYOffset = 0,
	endXOffset = 0,
	endYOffset = 0,
	dotted = false,
	dotSpacing = 6,
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
				const rectA = fromRef.current.getBoundingClientRect();
				const rectB = toRef.current.getBoundingClientRect();

				const svgWidth = containerRect.width;
				const svgHeight = containerRect.height;
				setSvgDimensions({ width: svgWidth, height: svgHeight });

				const startX =
					rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
				const startY =
					rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
				const endX =
					rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
				const endY =
					rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

				// Use straight line
				const d = `M ${startX},${startY} L ${endX},${endY}`;
				setPathD(d);
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
	}, [
		containerRef,
		fromRef,
		toRef,
		startXOffset,
		startYOffset,
		endXOffset,
		endYOffset,
	]);

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
