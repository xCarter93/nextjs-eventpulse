"use client";

import Link from "next/link";
import { MagicCard } from "@/components/ui/magic-card";
import SlidePricing from "@/components/pricing/pricing";
import { DarkGridHero } from "@/components/home-page/dark-grid-hero";
import { BetaBanner } from "@/components/beta-banner";

export default function LandingPage() {
	return (
		<div className="flex flex-col gap-12">
			{/* Beta Banner and Hero Section Wrapper */}
			<div className="flex flex-col">
				<BetaBanner />
				<DarkGridHero />
			</div>

			{/* Features Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-foreground" id="features">
						Everything You Need for Perfect Personalized Greetings
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<MagicCard className="p-6">
						<div className="text-3xl mb-4">🎨</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Personalized Color Themes
						</h3>
						<p className="text-muted-foreground">
							Create your perfect greeting with custom color schemes that match
							your style or brand. Make every message uniquely yours.
						</p>
					</MagicCard>

					<MagicCard className="p-6">
						<div className="text-3xl mb-4">🎬</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Custom Media Upload
						</h3>
						<p className="text-muted-foreground">
							Upload your own animations, images, or GIFs to create personalized
							greetings that capture the perfect moment or emotion.
						</p>
					</MagicCard>

					<MagicCard className="p-6">
						<div className="text-3xl mb-4">⚡</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Smart Scheduling
						</h3>
						<p className="text-muted-foreground">
							Set it and forget it! Schedule your greetings in advance and let
							us handle the delivery. Perfect for birthdays and special
							occasions.
						</p>
					</MagicCard>

					<MagicCard className="p-6">
						<div className="text-3xl mb-4">📅</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Event Management
						</h3>
						<p className="text-muted-foreground">
							Keep track of all your important dates in one place. Import
							contacts and never miss a special occasion again.
						</p>
					</MagicCard>

					<MagicCard className="p-6">
						<div className="text-3xl mb-4">✨</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Beautiful Animations
						</h3>
						<p className="text-muted-foreground">
							Choose from a variety of animation styles to make your greetings
							come alive. Add movement and magic to your messages.
						</p>
					</MagicCard>

					<MagicCard className="p-6">
						<div className="text-3xl mb-4">📧</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Email Integration
						</h3>
						<p className="text-muted-foreground">
							Seamless email delivery with beautiful, responsive designs that
							look great on any device. Track when your greetings are opened.
						</p>
					</MagicCard>
				</div>
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
