"use client";

import Link from "next/link";
import SlidePricing from "@/components/pricing/pricing";
import { DarkGridHero } from "@/components/home-page/dark-grid-hero";
import { BetaBanner } from "@/components/beta-banner";
import { Features, featuresData } from "@/components/home-page/features";

export default function LandingPage() {
	return (
		<div className="flex flex-col gap-12">
			{/* Beta Banner and Hero Section Wrapper */}
			<div className="flex flex-col">
				<BetaBanner />
				<DarkGridHero />
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
			<footer className="mt-auto">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="flex flex-col items-center space-y-2">
						<p>© 2024 EventPulse. All rights reserved.</p>
						<p className="flex items-center gap-2">
							Made with{" "}
							<span className="inline-block animate-[pulse_1.5s_ease-in-out_infinite] text-red-500">
								❤️
							</span>{" "}
							by{" "}
							<Link
								href="https://github.com/xCarter93"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								xCarter93
							</Link>
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
