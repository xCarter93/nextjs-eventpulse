"use client";

import { DarkGradientPricing } from "@/components/pricing/dark-gradient-pricing";
import { DarkGridHero } from "@/components/home-page/dark-grid-hero";
import { BetaBanner } from "@/components/beta-banner";
import { Features, featuresData } from "@/components/home-page/features";
import { Footer } from "@/components/layout/footer";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FAQ } from "@/components/home-page/faq";

export default function LandingPage() {
	const { isSignedIn } = useUser();
	const router = useRouter();

	return (
		<div className="flex flex-col gap-12">
			{/* Beta Banner and Hero Section Wrapper */}
			<div className="flex flex-col">
				<BetaBanner />
				<DarkGridHero
					isSignedIn={isSignedIn}
					onDashboardClick={() => router.push("/dashboard")}
				/>
			</div>

			{/* Features Section */}

			<Features data={featuresData} />

			{/* Add FAQ Section here */}
			<FAQ />

			{/* Pricing Section */}
			<DarkGradientPricing />

			{/* Footer */}
			<Footer />
		</div>
	);
}
