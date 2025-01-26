"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { PremiumModal } from "./PremiumModal";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface LockedFeatureProps {
	children: React.ReactNode;
	featureDescription: string;
}

export function LockedFeature({
	children,
	featureDescription,
}: LockedFeatureProps) {
	const [showPremiumModal, setShowPremiumModal] = useState(false);

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className="relative cursor-not-allowed opacity-50"
						onClick={() => setShowPremiumModal(true)}
					>
						{children}
						<div className="absolute inset-0 flex items-center justify-center bg-background/50">
							<Lock className="h-4 w-4" />
						</div>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p>Upgrade to Pro to {featureDescription}</p>
				</TooltipContent>
			</Tooltip>

			<PremiumModal
				isOpen={showPremiumModal}
				onClose={() => setShowPremiumModal(false)}
				featureRequested={featureDescription}
			/>
		</>
	);
}
