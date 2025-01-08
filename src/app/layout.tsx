import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "AnimGreet",
	description: "Send animated greetings to your loved ones",
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
							<Navbar />
							<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
								{children}
							</main>
							<Toaster />
						</ConvexClientProvider>
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
