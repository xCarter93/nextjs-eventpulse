"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import {
	LayoutDashboard,
	Users,
	Sparkles,
	Mail,
	Settings,
	CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const routes = [
	{
		label: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		label: "Recipients",
		href: "/recipients",
		icon: Users,
	},
	{
		label: "Animations",
		href: "/animations",
		icon: Sparkles,
	},
	{
		label: "Scheduled Emails",
		href: "/scheduled-emails",
		icon: Mail,
	},
	{
		label: "Settings",
		href: "/settings",
		icon: Settings,
	},
];

export function Navbar() {
	const { isSignedIn } = useUser();
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center">
				<div className="mr-4 flex items-center flex-1">
					<Link href="/" className="mr-6 flex items-center">
						<Image
							src="/EventPulse Logo-Photoroom.png"
							alt="EventPulse Logo"
							width={45}
							height={45}
							className="h-14 w-14"
						/>
						<span className="font-bold hidden lg:inline">EventPulse</span>
					</Link>
					{isSignedIn && (
						<nav className="flex items-center space-x-1 lg:space-x-4 text-sm font-medium">
							{routes.map((route) => (
								<Link
									key={route.href}
									href={route.href}
									className={cn(
										"flex items-center gap-2 rounded-lg transition-colors",
										"px-2 py-1.5 lg:px-3",
										pathname === route.href
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									)}
								>
									<route.icon className="h-4 w-4" />
									<span className="hidden lg:inline">{route.label}</span>
								</Link>
							))}
						</nav>
					)}
				</div>
				<div className="flex items-center space-x-2">
					<ThemeToggle />
					{isSignedIn ? (
						<UserButton
							afterSignOutUrl="/"
							appearance={{
								elements: {
									avatarBox: {
										width: 35,
										height: 35,
									},
								},
							}}
						>
							<UserButton.MenuItems>
								<UserButton.Link
									label="Billing"
									labelIcon={<CreditCard className="size-4" />}
									href="/billing"
								/>
							</UserButton.MenuItems>
						</UserButton>
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
