"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { createCheckoutSession } from "../premium/actions";
import { toast } from "sonner";
import { env } from "@/env";
import { useUser } from "@clerk/nextjs";

export default function SlidePricing() {
	const [selected, setSelected] = useState<"M" | "A">("M");

	return (
		<section className="w-full px-4 lg:px-8 py-12 lg:py-24 relative overflow-hidden">
			<Heading selected={selected} setSelected={setSelected} />
			<PriceCards selected={selected} />
			<TopLeftCircle />
			<BottomRightCircle />
		</section>
	);
}

const SELECTED_STYLES =
	"text-primary-foreground font-medium rounded-lg py-3 w-28 relative";
const DESELECTED_STYLES =
	"text-foreground font-medium rounded-lg py-3 w-28 hover:bg-accent transition-colors relative";

interface HeadingProps {
	selected: "M" | "A";
	setSelected: React.Dispatch<React.SetStateAction<"M" | "A">>;
}

const Heading = ({ selected, setSelected }: HeadingProps) => {
	return (
		<div className="mb-12 lg:mb-24 relative z-10">
			<h3 className="font-semibold text-5xl lg:text-7xl text-center mb-6 text-foreground">
				Simple Pricing
			</h3>
			<p className="text-center mx-auto max-w-lg mb-8 text-muted-foreground">
				Choose the plan that works best for you. All plans include access to our
				beautiful animation templates.
			</p>
			<div className="flex items-center justify-center gap-3">
				<button
					onClick={() => setSelected("M")}
					className={selected === "M" ? SELECTED_STYLES : DESELECTED_STYLES}
				>
					Monthly
					{selected === "M" && <BackgroundShift />}
				</button>
				<div className="relative">
					<button
						onClick={() => setSelected("A")}
						className={selected === "A" ? SELECTED_STYLES : DESELECTED_STYLES}
					>
						Annual
						{selected === "A" && <BackgroundShift />}
					</button>
					<CTAArrow />
				</div>
			</div>
		</div>
	);
};

const BackgroundShift = () => (
	<motion.span
		layoutId="bg-shift"
		className="absolute inset-0 bg-primary rounded-lg -z-10"
	/>
);

const CTAArrow = () => (
	<div className="absolute -right-[100px] top-2 sm:top-0">
		<motion.svg
			width="95"
			height="62"
			viewBox="0 0 95 62"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="scale-50 sm:scale-75"
			initial={{ scale: 0.7, rotate: 5 }}
			animate={{ scale: 0.75, rotate: 0 }}
			transition={{
				repeat: Infinity,
				repeatType: "mirror",
				duration: 1,
				ease: "easeOut",
			}}
		>
			<path
				d="M14.7705 15.8619C33.2146 15.2843 72.0772 22.1597 79.9754 54.2825"
				stroke="currentColor"
				strokeWidth="3"
				className="text-primary"
			/>
			<path
				d="M17.7987 7.81217C18.0393 11.5987 16.4421 15.8467 15.5055 19.282C15.2179 20.3369 14.9203 21.3791 14.5871 22.4078C14.4728 22.7608 14.074 22.8153 13.9187 23.136C13.5641 23.8683 12.0906 22.7958 11.7114 22.5416C8.63713 20.4812 5.49156 18.3863 2.58664 15.9321C1.05261 14.6361 2.32549 14.1125 3.42136 13.0646C4.37585 12.152 5.13317 11.3811 6.22467 10.7447C8.97946 9.13838 12.7454 8.32946 15.8379 8.01289"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
				className="text-primary"
			/>
		</motion.svg>
		<span className="block text-xs w-fit bg-primary text-primary-foreground shadow px-1.5 py-0.5 rounded -mt-1 ml-8 -rotate-2 font-light italic">
			Save 25%
		</span>
	</div>
);

interface PriceCardProps {
	selected: "M" | "A";
}

const PriceCards = ({ selected }: PriceCardProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const { isSignedIn } = useUser();

	const handleUpgradeClick = async () => {
		try {
			setIsLoading(true);
			const priceId =
				selected === "M"
					? env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY
					: env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL;

			if (!priceId) {
				throw new Error("Configuration error: Price ID not found");
			}

			const checkoutUrl = await createCheckoutSession(priceId);
			window.location.href = checkoutUrl;
		} catch (error) {
			console.error("Error creating checkout session:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to start checkout process. Please try again later."
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col lg:flex-row gap-8 lg:gap-4 w-full max-w-6xl mx-auto relative z-10">
			{/* FREE */}
			<div className="w-full bg-card p-6 border border-border rounded-xl">
				<p className="text-2xl font-bold mb-2 text-foreground">Free</p>
				<p className="text-lg mb-6 text-muted-foreground">
					Get started with animations
				</p>
				<p className="text-6xl font-bold mb-8 text-foreground">
					$0
					<span className="font-normal text-xl text-muted-foreground">
						/month
					</span>
				</p>
				<div className="flex items-center gap-2 mb-2">
					<svg
						width="20"
						height="15"
						viewBox="0 0 20 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0"
					>
						<path
							d="M6.35588 11.8345L1.61455 7.17002L0 8.7472L6.35588 15L20 1.57718L18.3968 0L6.35588 11.8345Z"
							fill="currentColor"
							className="text-foreground"
						/>
					</svg>
					<span className="text-base text-muted-foreground">
						Up to 5 recipients
					</span>
				</div>
				<div className="flex items-center gap-2 mb-2">
					<svg
						width="20"
						height="15"
						viewBox="0 0 20 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0"
					>
						<path
							d="M6.35588 11.8345L1.61455 7.17002L0 8.7472L6.35588 15L20 1.57718L18.3968 0L6.35588 11.8345Z"
							fill="currentColor"
							className="text-foreground"
						/>
					</svg>
					<span className="text-base text-muted-foreground">
						Basic animation templates
					</span>
				</div>
				<div className="flex items-center gap-2 mb-2">
					<svg
						width="20"
						height="15"
						viewBox="0 0 20 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0"
					>
						<path
							d="M6.35588 11.8345L1.61455 7.17002L0 8.7472L6.35588 15L20 1.57718L18.3968 0L6.35588 11.8345Z"
							fill="currentColor"
							className="text-foreground"
						/>
					</svg>
					<span className="text-base text-muted-foreground">
						Email reminders
					</span>
				</div>
				<div className="flex items-center gap-2 mb-2">
					<svg
						width="20"
						height="15"
						viewBox="0 0 20 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0"
					>
						<path
							d="M6.35588 11.8345L1.61455 7.17002L0 8.7472L6.35588 15L20 1.57718L18.3968 0L6.35588 11.8345Z"
							fill="currentColor"
							className="text-foreground"
						/>
					</svg>
					<span className="text-base text-muted-foreground">
						Custom animations (30-day storage)
					</span>
				</div>

				<motion.div
					whileHover={{ scale: 1.015 }}
					whileTap={{ scale: 0.985 }}
					className="w-full mt-8"
				>
					{!isSignedIn ? (
						<Link
							href="/sign-up"
							className="block w-full py-4 font-semibold bg-primary text-primary-foreground rounded-lg uppercase text-center"
						>
							Get Started
						</Link>
					) : (
						<Link
							href="/dashboard"
							className="block w-full py-4 font-semibold bg-primary text-primary-foreground rounded-lg uppercase text-center"
						>
							Go to Dashboard
						</Link>
					)}
				</motion.div>
			</div>

			{/* PRO  */}
			<div className="w-full bg-card p-6 border border-border rounded-xl">
				<p className="text-2xl font-bold mb-2 text-foreground">Pro</p>
				<p className="text-lg mb-6 text-muted-foreground">For power users</p>
				<div className="overflow-hidden mb-8">
					<AnimatePresence mode="wait">
						{selected === "M" ? (
							<motion.p
								key="monthly1"
								initial={{ y: -50, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								exit={{ y: 50, opacity: 0 }}
								transition={{ ease: "linear", duration: 0.25 }}
								className="text-6xl font-bold text-primary"
							>
								<span>$5</span>
								<span className="font-normal text-xl text-muted-foreground">
									/month
								</span>
							</motion.p>
						) : (
							<motion.p
								key="monthly2"
								initial={{ y: -50, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								exit={{ y: 50, opacity: 0 }}
								transition={{ ease: "linear", duration: 0.25 }}
								className="text-6xl font-bold text-primary"
							>
								<span>$3.75</span>
								<span className="font-normal text-xl text-muted-foreground">
									/month
								</span>
							</motion.p>
						)}
					</AnimatePresence>
				</div>
				<div className="flex items-center gap-2 mb-2">
					<svg
						width="20"
						height="15"
						viewBox="0 0 20 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0"
					>
						<path
							d="M6.35588 11.8345L1.61455 7.17002L0 8.7472L6.35588 15L20 1.57718L18.3968 0L6.35588 11.8345Z"
							fill="currentColor"
							className="text-foreground"
						/>
					</svg>
					<span className="text-base text-muted-foreground">
						Unlimited recipients
					</span>
				</div>
				<div className="flex items-center gap-2 mb-2">
					<svg
						width="20"
						height="15"
						viewBox="0 0 20 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0"
					>
						<path
							d="M6.35588 11.8345L1.61455 7.17002L0 8.7472L6.35588 15L20 1.57718L18.3968 0L6.35588 11.8345Z"
							fill="currentColor"
							className="text-foreground"
						/>
					</svg>
					<span className="text-base text-muted-foreground">
						All premium templates
					</span>
				</div>
				<div className="flex items-center gap-2 mb-2">
					<svg
						width="20"
						height="15"
						viewBox="0 0 20 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0"
					>
						<path
							d="M6.35588 11.8345L1.61455 7.17002L0 8.7472L6.35588 15L20 1.57718L18.3968 0L6.35588 11.8345Z"
							fill="currentColor"
							className="text-foreground"
						/>
					</svg>
					<span className="text-base text-muted-foreground">
						Automatic sending
					</span>
				</div>
				<div className="flex items-center gap-2 mb-2">
					<svg
						width="20"
						height="15"
						viewBox="0 0 20 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0"
					>
						<path
							d="M6.35588 11.8345L1.61455 7.17002L0 8.7472L6.35588 15L20 1.57718L18.3968 0L6.35588 11.8345Z"
							fill="currentColor"
							className="text-foreground"
						/>
					</svg>
					<span className="text-base text-muted-foreground">
						Priority support
					</span>
				</div>
				<div className="flex items-center gap-2 mb-2">
					<svg
						width="20"
						height="15"
						viewBox="0 0 20 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="shrink-0"
					>
						<path
							d="M6.35588 11.8345L1.61455 7.17002L0 8.7472L6.35588 15L20 1.57718L18.3968 0L6.35588 11.8345Z"
							fill="currentColor"
							className="text-foreground"
						/>
					</svg>
					<span className="text-base text-muted-foreground">
						Permanent custom animation storage
					</span>
				</div>

				<motion.button
					whileHover={{ scale: 1.015 }}
					whileTap={{ scale: 0.985 }}
					className="w-full py-4 mt-8 font-semibold bg-primary text-primary-foreground rounded-lg uppercase disabled:opacity-50 disabled:cursor-not-allowed"
					onClick={() => handleUpgradeClick()}
					disabled={isLoading}
				>
					{isLoading ? "Loading..." : "Upgrade Now"}
				</motion.button>
				{selected === "A" && (
					<p className="text-sm text-center mt-4 text-muted-foreground">
						Billed annually (${(3.75 * 12).toFixed(2)}/year)
					</p>
				)}
			</div>
		</div>
	);
};

const TopLeftCircle = () => {
	return (
		<div className="absolute -top-20 -left-20 w-[200px] h-[200px] rounded-full bg-primary/10 blur-3xl" />
	);
};

const BottomRightCircle = () => {
	return (
		<div className="absolute -bottom-20 -right-20 w-[200px] h-[200px] rounded-full bg-primary/10 blur-3xl" />
	);
};
