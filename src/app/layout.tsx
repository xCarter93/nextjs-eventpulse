import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";

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
					<nav className="bg-background border-b">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="flex justify-between h-16">
								<div className="flex">
									<div className="flex-shrink-0 flex items-center">
										<span className="text-xl font-bold text-foreground">
											AnimGreet
										</span>
									</div>
									<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
										<a
											href="/dashboard"
											className="border-transparent text-muted-foreground hover:text-foreground hover:border-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
										>
											Dashboard
										</a>
										<a
											href="/recipients"
											className="border-transparent text-muted-foreground hover:text-foreground hover:border-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
										>
											Recipients
										</a>
										<a
											href="/animations"
											className="border-transparent text-muted-foreground hover:text-foreground hover:border-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
										>
											Animations
										</a>
									</div>
								</div>
								<div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
									<ThemeToggle />
									<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium">
										Upgrade to Premium
									</button>
								</div>
							</div>
						</div>
					</nav>
					<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						{children}
					</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
