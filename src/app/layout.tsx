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
		<ClerkProvider>
			<html lang="en" suppressHydrationWarning>
				<body suppressHydrationWarning className={inter.className}>
					<ThemeProvider>
						<ConvexClientProvider>
							<TooltipProvider>
								<Navbar />
								<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
									{children}
								</main>
							</TooltipProvider>
						</ConvexClientProvider>
					</ThemeProvider>
					<Toaster />
				</body>
			</html>
		</ClerkProvider>
	);
}
