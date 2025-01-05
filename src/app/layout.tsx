import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "AnimGreet - Animated Birthday Greetings",
	description:
		"Create and send beautiful animated birthday greetings to your loved ones",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<Navbar />
					<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						{children}
					</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
