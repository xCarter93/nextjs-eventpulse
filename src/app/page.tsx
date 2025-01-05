import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MagicCard } from "@/components/ui/magic-card";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
	return (
		<div className="space-y-20 pb-20">
			{/* Hero Section */}
			<div className="relative bg-muted/50 py-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
							Create Magical Birthday Moments
						</h1>
						<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
							Design and send beautiful animated birthday greetings that will
							make your loved ones smile.
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
						Everything You Need for Perfect Birthday Wishes
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
							Custom Colors
						</h3>
						<p className="text-muted-foreground">
							Personalize every animation with your favorite colors and themes.
						</p>
					</MagicCard>

					<MagicCard className="p-6">
						<div className="text-3xl mb-4">📅</div>
						<h3 className="text-xl font-semibold mb-2 text-card-foreground">
							Never Miss a Birthday
						</h3>
						<p className="text-muted-foreground">
							Get reminders and schedule animations to send automatically.
						</p>
					</MagicCard>
				</div>
			</div>

			{/* Pricing Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-foreground">Simple Pricing</h2>
					<p className="text-muted-foreground mt-2">
						Choose the plan that works for you
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-4">
					<Card className="p-8">
						<div className="flex flex-col h-full">
							<h3 className="text-xl font-semibold mb-4 text-card-foreground">
								Free
							</h3>
							<p className="text-4xl font-bold mb-6 text-foreground">$0</p>
							<ul className="space-y-3 mb-8 flex-grow">
								<li className="flex items-center text-muted-foreground">
									<span className="text-primary mr-2">✓</span>
									Up to 5 recipients
								</li>
								<li className="flex items-center text-muted-foreground">
									<span className="text-primary mr-2">✓</span>
									Basic animation templates
								</li>
								<li className="flex items-center text-muted-foreground">
									<span className="text-primary mr-2">✓</span>
									Email reminders
								</li>
							</ul>
							<Button variant="outline" asChild className="w-full">
								<Link href="/dashboard">Get Started</Link>
							</Button>
						</div>
					</Card>

					<Card className="p-8 bg-gradient-to-br from-[#9333EA] to-[#4F46E5] relative">
						<div className="flex flex-col h-full relative">
							<Badge variant="secondary" className="absolute -top-12 right-0">
								Popular
							</Badge>
							<h3 className="text-xl font-semibold mb-4 text-primary-foreground">
								Premium
							</h3>
							<p className="text-4xl font-bold mb-6 text-primary-foreground">
								$5/mo
							</p>
							<ul className="space-y-3 mb-8 flex-grow">
								<li className="flex items-center text-primary-foreground/90">
									<span className="text-warning mr-2">✓</span>
									Unlimited recipients
								</li>
								<li className="flex items-center text-primary-foreground/90">
									<span className="text-warning mr-2">✓</span>
									All premium templates
								</li>
								<li className="flex items-center text-primary-foreground/90">
									<span className="text-warning mr-2">✓</span>
									Automatic sending
								</li>
								<li className="flex items-center text-primary-foreground/90">
									<span className="text-warning mr-2">✓</span>
									Priority support
								</li>
							</ul>
							<Button variant="secondary" asChild className="w-full">
								<Link href="/upgrade">Upgrade Now</Link>
							</Button>
						</div>
					</Card>
				</div>
			</div>

			{/* Footer */}
			<footer className="border-t border-border">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="text-center text-muted-foreground">
						<p>© 2024 AnimGreet. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
