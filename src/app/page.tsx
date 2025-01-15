"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import SlidePricing from "@/components/pricing/pricing";

export default function LandingPage() {
	return (
		<div className="space-y-20 pb-20">
			{/* Hero Section */}
			<div className="relative bg-muted/50 py-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
							Create Magical Celebration Moments
						</h1>
						<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
							Design and send beautiful animated greetings that will make your
							loved ones smile.
						</p>
						<Button asChild size="lg">
							<Link href="/animations">Create Your First Animation</Link>
						</Button>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-foreground">
						Everything You Need for Perfect Personalized Greetings
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<MagicCard className="p-6">
						<div className="text-3xl mb-4">✨</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Beautiful Templates
						</h3>
						<p className="text-muted-foreground">
							Choose from a variety of stunning animation templates designed to
							delight.
						</p>
					</MagicCard>

					<MagicCard className="p-6">
						<div className="text-3xl mb-4">🎨</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Custom Animations
						</h3>
						<p className="text-muted-foreground">
							Upload your own Lottie animations or customize our templates with
							your favorite colors.
						</p>
					</MagicCard>

					<MagicCard className="p-6">
						<div className="text-3xl mb-4">📅</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Never Miss an Important Date
						</h3>
						<p className="text-muted-foreground">
							Get reminders and schedule animations to send automatically.
						</p>
					</MagicCard>
				</div>
			</div>

			{/* Pricing Section */}
			<SlidePricing />

			{/* Footer */}
			<footer className="border-t border-border">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="flex flex-col items-center border-t border-border">
						<p>© 2024 EventPulse. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
