import Link from "next/link";
import { Github, Heart } from "lucide-react";

export function Footer() {
	return (
		<footer className="border-t bg-background/50 backdrop-blur-xl">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-8">
					{/* Main Footer Content */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{/* Branding & Copyright */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">EventPulse</h3>
							<p className="text-sm text-muted-foreground">
								Simplifying event management and personalized greetings for
								everyone.
							</p>
							<p className="text-sm text-muted-foreground">
								© 2024 EventPulse. All rights reserved.
							</p>
						</div>

						{/* Quick Links */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Quick Links</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="/terms-of-service"
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										Terms of Service
									</Link>
								</li>
								<li>
									<Link
										href="/privacy-policy"
										className="text-sm text-muted-foreground hover:text-foreground transition-colors"
									>
										Privacy Policy
									</Link>
								</li>
							</ul>
						</div>

						{/* Creator Info */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Creator</h3>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span>Made with</span>
								<Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
								<span>by</span>
								<Link
									href="https://github.com/xCarter93"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-primary hover:underline"
								>
									xCarter93
									<Github className="w-4 h-4" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
