"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { createCheckoutSession } from "./actions";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { env } from "@/env";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface PremiumModalProps {
	isOpen: boolean;
	onClose: () => void;
	featureRequested?: string;
}

// Constants for button styles
const SELECTED_STYLES =
	"text-primary-foreground font-medium rounded-lg py-3 w-28 relative";
const DESELECTED_STYLES =
	"text-foreground font-medium rounded-lg py-3 w-28 hover:bg-accent transition-colors relative";

export function PremiumModal({
	isOpen,
	onClose,
	featureRequested,
}: PremiumModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [selected, setSelected] = useState<"M" | "A">("M");
	const subscriptionLevel = useQuery(
		api.subscriptions.getUserSubscriptionLevel
	);
	const isPro = subscriptionLevel === "pro";

	const handleUpgrade = async () => {
		try {
			setIsLoading(true);
			const priceId =
				selected === "M"
					? env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY
					: env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL;

			if (!priceId) {
				throw new Error("Configuration error: Price ID not found");
			}

			const url = await createCheckoutSession(priceId);
			window.location.href = url;
		} catch (error) {
			console.error("Failed to create checkout session:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Benefits for the Pro plan
	const benefits = [
		{ text: "Unlimited recipients", checked: true },
		{ text: "Unlimited animation storage", checked: true },
		{ text: "Schedule emails as far in advance as you want", checked: true },
		{ text: "Add custom events", checked: true },
		{ text: "View recipient locations on a map", checked: true },
		{ text: "Customize reminder settings", checked: true },
		{ text: "Priority email delivery", checked: true },
	];

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-background via-background/95 to-background">
				<DialogHeader>
					<DialogTitle className="text-2xl">Upgrade to Pro</DialogTitle>
					<DialogDescription className="text-base">
						{featureRequested
							? `Upgrade to Pro to ${featureRequested}`
							: "Unlock all features with EventPulse Pro"}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-6 py-6">
					{/* Billing Toggle */}
					<div className="flex items-center justify-center gap-3 mt-2">
						<button
							onClick={() => setSelected("M")}
							className={selected === "M" ? SELECTED_STYLES : DESELECTED_STYLES}
						>
							Monthly
							{selected === "M" && (
								<motion.span
									layoutId="premium-bg-shift"
									className="absolute inset-0 bg-primary rounded-lg -z-10"
								/>
							)}
						</button>
						<div className="relative">
							<button
								onClick={() => setSelected("A")}
								className={
									selected === "A" ? SELECTED_STYLES : DESELECTED_STYLES
								}
							>
								Annual
								{selected === "A" && (
									<motion.span
										layoutId="premium-bg-shift"
										className="absolute inset-0 bg-primary rounded-lg -z-10"
									/>
								)}
							</button>
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
						</div>
					</div>

					{/* Price Display */}
					<div className="text-center mb-4">
						<div className="mb-3 flex items-center justify-center">
							<span className="inline-block text-4xl font-medium text-foreground">
								{selected === "M" ? "$5" : "$3.75"}
							</span>
							<span className="text-muted-foreground">/month</span>
						</div>
						{selected === "A" && (
							<span className="text-sm text-muted-foreground">
								Billed annually ($45/year)
							</span>
						)}
						<div className="mt-2">
							<span className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-center text-transparent">
								Best for power users
							</span>
						</div>
					</div>

					{/* Features */}
					<div className="space-y-4 py-4 border-t border-border">
						{benefits.map((benefit, i) => (
							<div key={i} className="flex items-center gap-3">
								{benefit.checked ? (
									<span className="grid size-5 place-content-center rounded-full bg-primary text-sm text-primary-foreground">
										<Check className="h-3 w-3" />
									</span>
								) : (
									<span className="grid size-5 place-content-center rounded-full bg-muted text-sm text-muted-foreground">
										<X className="h-3 w-3" />
									</span>
								)}
								<span className="text-sm text-muted-foreground">
									{benefit.text}
								</span>
							</div>
						))}
					</div>
				</div>
				<button
					onClick={handleUpgrade}
					disabled={isLoading || isPro}
					className={twMerge(
						"rounded-lg px-4 py-2 text-lg text-primary-foreground bg-primary transition-all hover:scale-[1.02] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] w-full"
					)}
				>
					{isLoading ? (
						<span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : isPro ? (
						"You're already on Pro"
					) : (
						"Upgrade Now"
					)}
				</button>
			</DialogContent>
		</Dialog>
	);
}
