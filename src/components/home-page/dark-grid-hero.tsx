import React, { useEffect, useState } from "react";
import { AnimationProps, motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const World = dynamic(() => import("./globe").then((m) => m.World), {
	ssr: false,
});

const colors = ["#9333ea", "#a855f7", "#7c3aed"];

const globeConfig = {
	pointSize: 4,
	globeColor: "#206797",
	showAtmosphere: true,
	atmosphereColor: "#FFFFFF",
	atmosphereAltitude: 0.15,
	emissive: "#000000",
	emissiveIntensity: 0.1,
	shininess: 0.9,
	polygonColor: "rgba(255,255,255,0.7)",
	ambientLight: "#ffffff",
	directionalLeftLight: "#ffffff",
	directionalTopLight: "#9333ea",
	pointLight: "#ffffff",
	arcTime: 1000,
	arcLength: 0.9,
	rings: 1,
	maxRings: 3,
	initialPosition: { lat: 22.3193, lng: 114.1694 },
	autoRotate: true,
	autoRotateSpeed: 0.5,
};

const demoData = [
	{
		order: 1,
		startLat: -19.885592,
		startLng: -43.951191,
		endLat: -22.9068,
		endLng: -43.1729,
		arcAlt: 0.1,
		color: colors[Math.floor(Math.random() * colors.length)],
	},
	{
		order: 2,
		startLat: 28.6139,
		startLng: 77.209,
		endLat: 3.139,
		endLng: 101.6869,
		arcAlt: 0.2,
		color: colors[Math.floor(Math.random() * colors.length)],
	},
	{
		order: 3,
		startLat: 51.5072,
		startLng: -0.1276,
		endLat: 3.139,
		endLng: 101.6869,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * colors.length)],
	},
	{
		order: 4,
		startLat: -33.8688,
		startLng: 151.2093,
		endLat: 22.3193,
		endLng: 114.1694,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * colors.length)],
	},
	{
		order: 5,
		startLat: 21.3099,
		startLng: -157.8581,
		endLat: 40.7128,
		endLng: -74.006,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * colors.length)],
	},
	{
		order: 6,
		startLat: -6.2088,
		startLng: 106.8456,
		endLat: 51.5072,
		endLng: -0.1276,
		arcAlt: 0.3,
		color: colors[Math.floor(Math.random() * colors.length)],
	},
];

export const DarkGridHero = () => {
	return (
		<section className="relative overflow-hidden bg-background min-h-screen">
			<Content />
			<Beams />
			<GradientGrid />
		</section>
	);
};

const Content = () => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// Wait for component to be mounted and give time for Three.js initialization
		const timer = setTimeout(() => setMounted(true), 500);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="relative z-20 mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-36">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
				<div className="flex flex-col items-start">
					<motion.div
						initial={{ y: 25, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 1.25, ease: "easeInOut" }}
					>
						<GlowingChip>✨ Create magical moments</GlowingChip>
					</motion.div>
					<motion.h1
						initial={{ y: 25, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 1.25, delay: 0.25, ease: "easeInOut" }}
						className="mb-3 text-left text-3xl font-bold leading-tight text-foreground sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight lg:text-7xl lg:leading-tight"
					>
						Create Magical Celebration Moments
					</motion.h1>
					<motion.p
						initial={{ y: 25, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 1.25, delay: 0.5, ease: "easeInOut" }}
						className="mb-9 max-w-2xl text-left text-base leading-relaxed text-muted-foreground sm:text-lg md:text-lg md:leading-relaxed"
					>
						Design and send beautiful animated greetings that will make your
						loved ones smile.
					</motion.p>
				</div>
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1.25, delay: 0.75, ease: "easeInOut" }}
					className="relative lg:h-[600px] h-[400px] w-full"
					style={{
						contain: "layout size paint",
						position: "relative",
						isolation: "isolate",
						perspective: "1000px",
						perspectiveOrigin: "50% 50%",
						willChange: "transform",
						transformStyle: "preserve-3d",
						height: "min(600px, 70vh)",
						minHeight: "400px",
					}}
				>
					<div
						className="absolute inset-0"
						style={{
							transform: "translateZ(0)",
							backfaceVisibility: "hidden",
							contain: "layout size paint",
							transformStyle: "preserve-3d",
						}}
					>
						{mounted && (
							<World
								data={demoData}
								globeConfig={{
									...globeConfig,
									pointSize:
										typeof window !== "undefined" && window.innerWidth < 1024
											? 2
											: 4,
								}}
							/>
						)}
					</div>
				</motion.div>
			</div>
			<motion.div
				initial={{ y: 25, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 1.25, delay: 1, ease: "easeInOut" }}
				className="flex justify-center mt-12"
			>
				<Link
					href="/sign-up"
					className="relative inline-flex h-12 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
				>
					<span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,theme(colors.primary.DEFAULT/0.1)_0%,theme(colors.primary.DEFAULT/0.8)_50%,theme(colors.primary.DEFAULT/0.1)_100%)]" />
					<span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-background px-8 py-1 text-base font-medium text-foreground backdrop-blur-3xl">
						Sign Up to get started
						<ArrowRightIcon className="h-5 w-5" />
					</span>
				</Link>
			</motion.div>
		</div>
	);
};

const GlowingChip = ({ children }: { children: string }) => {
	return (
		<span className="relative z-10 mb-4 inline-block rounded-full border border-border bg-primary/10 dark:bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary dark:text-primary-foreground md:mb-0">
			{children}
			<span className="absolute bottom-0 left-3 right-3 h-[1px] bg-gradient-to-r from-border/0 via-border to-border/0" />
		</span>
	);
};

const Beams = () => {
	const { width } = useWindowSize();

	const numColumns = width ? Math.floor(width / GRID_BOX_SIZE) : 0;

	const placements = [
		{
			top: GRID_BOX_SIZE * 0,
			left: Math.floor(numColumns * 0.05) * GRID_BOX_SIZE,
			transition: {
				duration: 3.5,
				repeatDelay: 5,
				delay: 2,
			},
		},
		{
			top: GRID_BOX_SIZE * 12,
			left: Math.floor(numColumns * 0.15) * GRID_BOX_SIZE,
			transition: {
				duration: 3.5,
				repeatDelay: 10,
				delay: 4,
			},
		},
		{
			top: GRID_BOX_SIZE * 3,
			left: Math.floor(numColumns * 0.25) * GRID_BOX_SIZE,
		},
		{
			top: GRID_BOX_SIZE * 9,
			left: Math.floor(numColumns * 0.75) * GRID_BOX_SIZE,
			transition: {
				duration: 2,
				repeatDelay: 7.5,
				delay: 3.5,
			},
		},
		{
			top: 0,
			left: Math.floor(numColumns * 0.7) * GRID_BOX_SIZE,
			transition: {
				duration: 3,
				repeatDelay: 2,
				delay: 1,
			},
		},
		{
			top: GRID_BOX_SIZE * 2,
			left: Math.floor(numColumns * 1) * GRID_BOX_SIZE - GRID_BOX_SIZE,
			transition: {
				duration: 5,
				repeatDelay: 5,
				delay: 5,
			},
		},
	];

	return (
		<>
			{placements.map((p, i) => (
				<Beam
					key={i}
					top={p.top}
					left={p.left - BEAM_WIDTH_OFFSET}
					transition={p.transition || {}}
				/>
			))}
		</>
	);
};

const useWindowSize = () => {
	const [windowSize, setWindowSize] = useState<WindowSize>({
		width: undefined,
		height: undefined,
	});

	useEffect(() => {
		const handleResize = () =>
			setWindowSize({ width: window.innerWidth, height: window.innerHeight });

		window.addEventListener("resize", handleResize);

		handleResize();

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return windowSize;
};

const Beam = ({ top, left, transition = {} }: BeamType) => {
	return (
		<motion.div
			initial={{
				y: 0,
				opacity: 0,
			}}
			animate={{
				opacity: [0, 1, 0],
				y: 32 * 8,
			}}
			transition={{
				ease: "easeInOut",
				duration: 3,
				repeat: Infinity,
				repeatDelay: 1.5,
				...transition,
			}}
			style={{
				top,
				left,
			}}
			className="absolute z-10 h-[64px] w-[1px] bg-gradient-to-b from-primary/0 to-primary"
		/>
	);
};

const GradientGrid = () => {
	return (
		<motion.div
			initial={{
				opacity: 0,
			}}
			animate={{
				opacity: 1,
			}}
			transition={{
				duration: 2.5,
				ease: "easeInOut",
			}}
			className="absolute inset-0 z-0"
		>
			<div
				style={{
					backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(30 58 138 / 0.15)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
				}}
				className="absolute inset-0 z-0 dark:opacity-50"
			/>
			<div className="absolute inset-0 z-10">
				<div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
				<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
				<div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
				<div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
			</div>
		</motion.div>
	);
};

const GRID_BOX_SIZE = 32;
const BEAM_WIDTH_OFFSET = 1;

type WindowSize = {
	width: number | undefined;
	height: number | undefined;
};

type BeamType = {
	top: number;
	left: number;
	transition?: AnimationProps["transition"];
};
