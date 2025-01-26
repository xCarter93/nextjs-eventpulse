"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { createCheckoutSession } from "./actions";
import { Check } from "lucide-react";
import { useState } from "react";
import { env } from "@/env";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumModalProps {
	isOpen: boolean;
	onClose: () => void;
	featureRequested?: string;
}

export function PremiumModal({
	isOpen,
	onClose,
	featureRequested,
}: PremiumModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [selected, setSelected] = useState<"M" | "A">("M");

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

	const features = [
		"Unlimited recipients",
		"Unlimited animation storage",
		"Schedule emails as far in advance as you want",
		"Add custom events",
		"View recipient locations on a map",
		"Customize reminder settings",
		"Customize event window and max events",
	];

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px]">
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
					<div className="flex items-center justify-center gap-6 mb-2">
						<button
							onClick={() => setSelected("M")}
							className={`text-foreground font-medium rounded-lg py-3 w-32 relative ${
								selected === "M"
									? "text-primary-foreground"
									: "hover:bg-accent transition-colors"
							}`}
						>
							Monthly
							{selected === "M" && (
								<motion.span
									layoutId="bg-shift"
									className="absolute inset-0 bg-primary rounded-lg -z-10"
								/>
							)}
						</button>
						<div className="relative">
							<button
								onClick={() => setSelected("A")}
								className={`text-foreground font-medium rounded-lg py-3 w-32 relative ${
									selected === "A"
										? "text-primary-foreground"
										: "hover:bg-accent transition-colors"
								}`}
							>
								Annual
								{selected === "A" && (
									<motion.span
										layoutId="bg-shift"
										className="absolute inset-0 bg-primary rounded-lg -z-10"
									/>
								)}
							</button>
							<div className="absolute -right-[100px] top-0">
								<span className="block text-xs w-fit bg-primary text-primary-foreground shadow px-2 py-1 rounded -mt-1 ml-8 -rotate-2 font-light italic">
									Save 25%
								</span>
							</div>
						</div>
					</div>

					{/* Price Display */}
					<div className="text-center mb-2">
						<AnimatePresence mode="wait">
							{selected === "M" ? (
								<motion.p
									key="monthly"
									initial={{ y: -20, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: 20, opacity: 0 }}
									className="text-5xl font-bold text-primary"
								>
									$5
									<span className="text-2xl font-normal text-muted-foreground">
										/month
									</span>
								</motion.p>
							) : (
								<motion.p
									key="annual"
									initial={{ y: -20, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: 20, opacity: 0 }}
									className="text-5xl font-bold text-primary"
								>
									$3.75
									<span className="text-2xl font-normal text-muted-foreground">
										/month
									</span>
								</motion.p>
							)}
						</AnimatePresence>
						{selected === "A" && (
							<p className="text-sm text-muted-foreground mt-2">
								Billed annually (${(3.75 * 12).toFixed(2)}/year)
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						{features.map((feature, index) => (
							<div key={index} className="flex items-center">
								<Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
								<span className="text-sm text-muted-foreground">{feature}</span>
							</div>
						))}
					</div>
				</div>
				<Button
					onClick={handleUpgrade}
					className="w-full"
					size="lg"
					disabled={isLoading}
				>
					{isLoading ? (
						<span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : (
						"Upgrade to Pro"
					)}
				</Button>
			</DialogContent>
		</Dialog>
	);
}
