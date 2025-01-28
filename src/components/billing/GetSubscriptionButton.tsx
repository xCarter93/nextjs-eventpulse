"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PremiumModal } from "@/components/premium/PremiumModal";

export function GetSubscriptionButton() {
	const [showPremiumModal, setShowPremiumModal] = useState(false);

	return (
		<>
			<Button onClick={() => setShowPremiumModal(true)}>Choose a Plan</Button>
			<PremiumModal
				isOpen={showPremiumModal}
				onClose={() => setShowPremiumModal(false)}
			/>
		</>
	);
}
