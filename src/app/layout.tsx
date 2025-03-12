import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TourProvider } from "@/components/providers/tour-provider";
import DatadogInit from "@/components/datadog/datadog-init";
import { CSPostHogProvider } from "@/components/providers/PostHogProvier";
import { FloatingChatButtonWrapper } from "@/components/chat/FloatingChatButtonWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "EventPulse",
	description:
		"Stay connected with your loved ones through timely event reminders and personalized messages.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider
			publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
			afterSignOutUrl="/"
			signInFallbackRedirectUrl="/dashboard"
			signUpFallbackRedirectUrl="/dashboard"
		>
			<html lang="en" suppressHydrationWarning>
				<CSPostHogProvider>
					<body suppressHydrationWarning className={inter.className}>
						<DatadogInit />
						<ThemeProvider>
							<ConvexClientProvider>
								<TooltipProvider>
									<TourProvider>
										<div className="min-h-screen flex flex-col bg-background">
											<Navbar />
											<main className="main-content flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
												{children}
											</main>
											<FloatingChatButtonWrapper />
										</div>
									</TourProvider>
								</TooltipProvider>
							</ConvexClientProvider>
						</ThemeProvider>
						<Toaster />
					</body>
				</CSPostHogProvider>
			</html>
		</ClerkProvider>
	);
}
