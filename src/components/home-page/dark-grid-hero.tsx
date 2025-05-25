import React, { useEffect, useState } from "react";
import { AnimationProps, motion } from "framer-motion";
import { PlayCircleIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { Button, Card, CardBody } from "@heroui/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface DarkGridHeroProps {
	isSignedIn?: boolean;
	onDashboardClick?: () => void;
}

export const DarkGridHero = ({
	isSignedIn,
	onDashboardClick,
}: DarkGridHeroProps) => {
	return (
		<section className="relative overflow-hidden bg-background">
			<Content isSignedIn={isSignedIn} onDashboardClick={onDashboardClick} />
			<Beams />
			<GradientGrid />
		</section>
	);
};

interface ContentProps {
	isSignedIn?: boolean;
	onDashboardClick?: () => void;
}

const Content = ({ isSignedIn, onDashboardClick }: ContentProps) => {
	return (
		<div className="relative z-20 mx-auto max-w-7xl px-4 py-16 md:py-24 lg:py-28">
			<div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
				{/* Left Column - Text and Buttons */}
				<motion.div
					className="flex-1 text-center lg:text-left"
					initial={{ y: 25, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 1.25, ease: "easeInOut" }}
				>
					<GlowingChip>✨ Event Management Reimagined</GlowingChip>

					<motion.h1
						initial={{ y: 25, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 1.25, delay: 0.25, ease: "easeInOut" }}
						className="mt-4 text-4xl font-bold leading-tight text-foreground sm:text-5xl sm:leading-tight md:text-5xl md:leading-tight lg:text-6xl lg:leading-tight"
					>
						Never Miss Another{" "}
						<span className="text-primary">Important Moment</span>
					</motion.h1>

					<motion.p
						initial={{ y: 25, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 1.25, delay: 0.5, ease: "easeInOut" }}
						className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg md:text-lg md:leading-relaxed max-w-xl mx-auto lg:mx-0"
					>
						EventPulse helps you track important dates, create stunning animated
						emails, and delight your recipients with personalized
						celebrations—all with the help of our AI assistant.
					</motion.p>

					<motion.div
						initial={{ y: 25, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 1.25, delay: 0.75, ease: "easeInOut" }}
						className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
					>
						{isSignedIn ? (
							<Button
								color="primary"
								size="lg"
								className="px-8 font-medium"
								startContent={<ZapIcon className="h-4 w-4" />}
								onClick={onDashboardClick}
							>
								Continue to Dashboard
							</Button>
						) : (
							<Link href="/sign-up">
								<Button
									color="primary"
									size="lg"
									className="px-8 font-medium"
									startContent={<ZapIcon className="h-4 w-4" />}
								>
									Get Started Free
								</Button>
							</Link>
						)}
						<motion.div
							whileHover={{
								scale: 1.05,
								transition: { duration: 0.2 },
							}}
						>
							<Button
								variant="bordered"
								size="lg"
								className="px-8 font-medium hover:bg-primary/10 hover:border-primary transition-colors"
								startContent={<PlayCircleIcon className="h-4 w-4" />}
							>
								Watch Demo
							</Button>
						</motion.div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, delay: 1 }}
						className="mt-8 flex items-center justify-center lg:justify-start gap-4"
					>
						<div className="flex -space-x-2">
							{[1, 2, 3, 4].map((id) => (
								<div
									key={id}
									className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background overflow-hidden"
								/>
							))}
						</div>
						<p className="text-sm text-muted-foreground">
							<span className="font-semibold text-foreground">1,000+</span>{" "}
							event planners trust EventPulse
						</p>
					</motion.div>
				</motion.div>

				{/* Right Column - Lottie Animation */}
				<motion.div
					className="flex-1"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
				>
					<Card className="shadow-xl border border-primary/10 overflow-hidden bg-background/20 backdrop-blur-sm">
						<CardBody className="p-0 flex items-center justify-center">
							<div className="w-full max-w-md mx-auto aspect-square">
								<DotLottieReact
									src="https://lottie.host/1f5b2a77-f3b0-4d02-a48f-940fe94bc7b2/pnU3lr9UGa.lottie"
									loop
									autoplay
									className="w-full h-full object-contain"
								/>
							</div>
						</CardBody>
					</Card>
				</motion.div>
			</div>
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
