"use client";

import SlidePricing from "@/components/pricing/pricing";
import { DarkGridHero } from "@/components/home-page/dark-grid-hero";
import { BetaBanner } from "@/components/beta-banner";
import { Features, featuresData } from "@/components/home-page/features";
import { Footer } from "@/components/layout/footer";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-foreground" id="features">
						Everything You Need for Perfect Personalized Greetings
					</h2>
				</div>
				<Features data={featuresData} />
			</div>

			{/* Pricing Section */}
			<SlidePricing />

			{/* Footer */}
			<Footer />
		</div>
	);
}
