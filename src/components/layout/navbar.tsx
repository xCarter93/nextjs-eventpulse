"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

export function Navbar() {
	const { isSignedIn } = useUser();

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center">
				<div className="mr-4 flex">
					<Link href="/" className="mr-6 flex items-center space-x-2">
						<span className="font-bold">AnimGreet</span>
					</Link>
					{isSignedIn && (
						<nav className="flex items-center space-x-6 text-sm font-medium">
							<Link
								href="/dashboard"
								className="transition-colors hover:text-foreground/80 text-foreground"
							>
								Dashboard
							</Link>
							<Link
								href="/animations"
								className="transition-colors hover:text-foreground/80 text-foreground"
							>
								Animations
							</Link>
							<Link
								href="/recipients"
								className="transition-colors hover:text-foreground/80 text-foreground"
							>
								Recipients
							</Link>
						</nav>
					)}
				</div>
				<div className="flex flex-1 items-center space-x-2 justify-end">
					<ThemeToggle />
					{isSignedIn ? (
						<UserButton afterSignOutUrl="/" />
					) : (
						<SignInButton mode="modal">
							<Button variant="outline" size="sm">
								Sign In
							</Button>
						</SignInButton>
					)}
				</div>
			</div>
		</header>
	);
}
