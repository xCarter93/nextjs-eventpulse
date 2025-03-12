"use client";

import React, { ReactNode, CSSProperties } from "react";
import { Check, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { createCheckoutSession } from "../premium/actions";
import { toast } from "sonner";
import { env } from "@/env";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const DarkGradientPricing = () => {
	const [isLoading, setIsLoading] = React.useState(false);
	const [selected, setSelected] = React.useState<"M" | "A">("M");
	const { isSignedIn } = useUser();
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const isPro = subscriptionLevel === "pro";

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

	// Common benefits for both plans
	const benefits = [
		{
			text: "Recipients",
			free: "Up to 5 recipients",
			pro: "Unlimited recipients",
		},
		{
			text: "Media storage",
			free: "10-day media storage",
			pro: "Unlimited media storage",
		},
		{
			text: "Advance scheduling",
			free: "7-day advance scheduling",
			pro: "Unlimited advance scheduling",
		},
		{
			text: "Email reminders",
			free: "Basic (7 days before)",
			pro: "Advanced (customize days)",
		},
		{ text: "Custom color themes", free: true, pro: true },
		{ text: "Recipient map visualization", free: false, pro: true },
		{ text: "Priority email delivery", free: false, pro: true },
	];

	return (
		<section
			className="relative overflow-hidden py-16 lg:py-20 border-t border-b border-border/30"
			id="pricing"
			style={{
				width: "100vw",
				marginLeft: "calc(50% - 50vw)",
				marginRight: "calc(50% - 50vw)",
				boxSizing: "border-box",
				background:
					"linear-gradient(to bottom, hsl(var(--background)), hsl(var(--muted)/0.05) 50%, hsl(var(--background)) 100%)",
			}}
		>
			{/* Background elements */}
			<div className="absolute left-0 top-0 h-[400px] w-[400px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/4" />
			<div className="absolute right-0 bottom-0 h-[400px] w-[400px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[150px] translate-x-1/2 translate-y-1/4" />

			{/* Content container */}
			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-12 space-y-3">
					<h2 className="text-center text-3xl font-bold leading-tight sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight text-foreground">
						Simple Pricing
					</h2>
					<p className="text-center text-base text-muted-foreground md:text-lg">
						Choose the plan that works best for you. Upgrade anytime to unlock
						advanced features and remove limitations.
					</p>

					{/* Billing Toggle */}
					<div className="flex items-center justify-center gap-3 mt-8">
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
								className={
									selected === "A" ? SELECTED_STYLES : DESELECTED_STYLES
								}
							>
								Annual
								{selected === "A" && <BackgroundShift />}
							</button>
							<CTAArrow />
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
					{/* Free Plan */}
					<PriceCard
						tier="Free"
						price="$0"
						period="/month"
						bestFor="Best for getting started"
						CTA={
							!isSignedIn ? (
								<GhostButton className="w-full">
									<Link href="/sign-up">Get started free</Link>
								</GhostButton>
							) : (
								<GhostButton className="w-full">
									<Link href="/dashboard">Go to Dashboard</Link>
								</GhostButton>
							)
						}
					>
						<div className="space-y-4 py-9">
							{benefits.map((benefit, i) => (
								<Benefit
									key={i}
									text={
										typeof benefit.free === "string"
											? benefit.free
											: benefit.text
									}
									checked={benefit.free !== false}
								/>
							))}
						</div>
					</PriceCard>

					{/* Pro Plan */}
					<PriceCard
						tier="Pro"
						price={selected === "M" ? "$5" : "$3.75"}
						period={selected === "M" ? "/month" : "/month"}
						subtext={selected === "A" ? "Billed annually ($45/year)" : ""}
						bestFor="Best for power users"
						CTA={
							!isSignedIn ? (
								<GhostButton className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
									<Link href="/sign-in?redirect=/billing">
										Sign in to upgrade
									</Link>
								</GhostButton>
							) : isPro ? (
								<GhostButton className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
									<Link href="/dashboard">Go to Dashboard</Link>
								</GhostButton>
							) : (
								<GhostButton
									className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
									onClick={handleUpgradeClick}
									disabled={isLoading}
								>
									{isLoading ? "Loading..." : "Upgrade Now"}
								</GhostButton>
							)
						}
					>
						<div className="space-y-4 py-9">
							{benefits.map((benefit, i) => (
								<Benefit
									key={i}
									text={
										typeof benefit.pro === "string" ? benefit.pro : benefit.text
									}
									checked={true}
								/>
							))}
						</div>
					</PriceCard>
				</div>
			</div>
		</section>
	);
};

const SELECTED_STYLES =
	"text-primary-foreground font-medium rounded-lg py-3 w-28 relative";
const DESELECTED_STYLES =
	"text-foreground font-medium rounded-lg py-3 w-28 hover:bg-accent transition-colors relative";

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

type PriceCardProps = {
	tier: string;
	price: string;
	period: string;
	subtext?: string;
	bestFor: string;
	CTA: ReactNode;
	children: ReactNode;
};

const PriceCard = ({
	tier,
	price,
	period,
	subtext,
	bestFor,
	CTA,
	children,
}: PriceCardProps) => {
	return (
		<Card>
			<div className="flex flex-col items-center border-b border-border pb-6">
				<span className="mb-6 inline-block text-foreground font-bold text-2xl">
					{tier}
				</span>
				<div className="mb-3 flex items-end">
					<span className="inline-block text-4xl font-medium text-foreground">
						{price}
					</span>
					<span className="text-muted-foreground">{period}</span>
				</div>
				{subtext && (
					<span className="text-sm text-muted-foreground mb-2">{subtext}</span>
				)}
				<span className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-center text-transparent">
					{bestFor}
				</span>
			</div>

			{children}

			{CTA}
		</Card>
	);
};

const Benefit = ({ text, checked }: BenefitType) => {
	return (
		<div className="flex items-center gap-3">
			{checked ? (
				<span className="grid size-5 place-content-center rounded-full bg-primary text-sm text-primary-foreground">
					<Check className="h-3 w-3" />
				</span>
			) : (
				<span className="grid size-5 place-content-center rounded-full bg-muted text-sm text-muted-foreground">
					<X className="h-3 w-3" />
				</span>
			)}
			<span className="text-sm text-muted-foreground">{text}</span>
		</div>
	);
};

const Card = ({ className, children, style = {} }: CardProps) => {
	return (
		<motion.div
			initial={{
				filter: "blur(2px)",
				opacity: 0,
				y: 20,
			}}
			whileInView={{
				filter: "blur(0px)",
				opacity: 1,
				y: 0,
			}}
			transition={{
				duration: 0.5,
				ease: "easeInOut",
				delay: 0.25,
			}}
			style={style}
			className={twMerge(
				"relative h-full w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm p-6 hover:shadow-md transition-shadow duration-300",
				className
			)}
		>
			{children}
		</motion.div>
	);
};

const GhostButton = ({
	children,
	className,
	onClick,
	disabled,
	...rest
}: GhostButtonProps) => {
	return (
		<button
			className={twMerge(
				"rounded-lg px-4 py-2 text-lg text-foreground transition-all hover:scale-[1.02] hover:bg-accent/50 hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
				className
			)}
			onClick={onClick}
			disabled={disabled}
			{...rest}
		>
			{children}
		</button>
	);
};

type CardProps = {
	className?: string;
	children?: ReactNode;
	style?: CSSProperties;
};

type BenefitType = {
	text: string;
	checked: boolean;
};

type GhostButtonProps = {
	children: ReactNode;
	className?: string;
	onClick?: () => void;
	disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
