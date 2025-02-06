"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
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
import {
	Navbar as HeroNavbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	NavbarMenuToggle,
	NavbarMenu,
	NavbarMenuItem,
	Button,
} from "@heroui/react";
import { useState } from "react";
import EventPulseLogo from "./EventPulseLogo";

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
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<div className="sticky top-0 z-50">
			<div className="relative">
				<HeroNavbar
					isMenuOpen={isMenuOpen}
					onMenuOpenChange={setIsMenuOpen}
					className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
					maxWidth="2xl"
					isBordered
				>
					<NavbarContent className="lg:hidden" justify="start">
						{isSignedIn && (
							<NavbarMenuToggle
								aria-label={isMenuOpen ? "Close menu" : "Open menu"}
							/>
						)}
					</NavbarContent>

					<NavbarContent className="lg:flex gap-4" justify="start">
						<NavbarBrand as={Link} href="/" className="gap-2 hidden lg:block">
							<div className="scale-[0.35] origin-left">
								<EventPulseLogo />
							</div>
						</NavbarBrand>
					</NavbarContent>

					{isSignedIn && (
						<NavbarContent className="hidden lg:flex gap-3" justify="center">
							{routes.map((route) => (
								<NavbarItem key={route.href} isActive={pathname === route.href}>
									<Link
										href={route.href}
										className={cn(
											"flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors text-sm",
											pathname === route.href
												? "text-primary"
												: "text-muted-foreground hover:text-foreground"
										)}
									>
										<route.icon className="h-3.5 w-3.5" />
										<span>{route.label}</span>
									</Link>
								</NavbarItem>
							))}
						</NavbarContent>
					)}

					<NavbarContent justify="end">
						<NavbarItem>
							<div className="scale-90">
								<ThemeToggle />
							</div>
						</NavbarItem>
						<NavbarItem className="flex items-center">
							{isSignedIn ? (
								<UserButton
									appearance={{
										elements: {
											avatarBox: {
												width: 36,
												height: 36,
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
									<Button
										color="primary"
										variant="shadow"
										size="sm"
										radius="full"
										className="font-medium"
									>
										Sign In
									</Button>
								</SignInButton>
							)}
						</NavbarItem>
					</NavbarContent>

					{isSignedIn && (
						<NavbarMenu className="z-[100]">
							{routes.map((route) => (
								<NavbarMenuItem key={route.href}>
									<Link
										href={route.href}
										className={cn(
											"flex items-center gap-2 w-full p-3 rounded-lg transition-colors",
											pathname === route.href
												? "text-primary bg-primary/10"
												: "text-muted-foreground hover:text-foreground hover:bg-muted"
										)}
										onClick={() => setIsMenuOpen(false)}
									>
										<route.icon className="h-5 w-5" />
										<span>{route.label}</span>
									</Link>
								</NavbarMenuItem>
							))}
						</NavbarMenu>
					)}
				</HeroNavbar>

				{/* Centered glowing gradient effect */}
				<div className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-gradient-to-r from-transparent via-primary to-transparent h-[3px] w-3/4 blur-sm opacity-100" />
				<div className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-gradient-to-r from-transparent via-primary to-transparent h-[1.5px] w-3/4 opacity-100" />
				<div className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-gradient-to-r from-transparent via-primary to-transparent h-[6px] w-1/3 blur-sm opacity-75" />
				<div className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-gradient-to-r from-transparent via-primary to-transparent h-[1.5px] w-1/3 opacity-90" />
			</div>
		</div>
	);
}
