import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const navLinks = [
	{ href: "/dashboard", label: "Dashboard" },
	{ href: "/recipients", label: "Recipients" },
	{ href: "/animations", label: "Animations" },
] as const;

export function Navbar() {
	return (
		<nav className="bg-background border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex">
						<div className="flex-shrink-0 flex items-center">
							<Link href="/" className="text-xl font-bold text-foreground">
								AnimGreet
							</Link>
						</div>
						<div className="hidden md:ml-6 md:flex md:space-x-8">
							{navLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="border-transparent text-muted-foreground hover:text-foreground hover:border-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>
					<div className="hidden md:ml-6 md:flex md:items-center space-x-4">
						<ThemeToggle />
						<Button asChild>
							<Link href="/upgrade">Upgrade to Premium</Link>
						</Button>
					</div>
					<div className="flex items-center md:hidden space-x-4">
						<ThemeToggle />
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="outline" size="icon">
									<Menu className="h-5 w-5" />
									<span className="sr-only">Open menu</span>
								</Button>
							</SheetTrigger>
							<SheetContent side="right">
								<SheetHeader>
									<SheetTitle>Menu</SheetTitle>
								</SheetHeader>
								<div className="flex flex-col space-y-4 mt-6">
									{navLinks.map((link) => (
										<Link
											key={link.href}
											href={link.href}
											className="text-muted-foreground hover:text-foreground py-2 text-sm font-medium"
										>
											{link.label}
										</Link>
									))}
									<Separator className="my-2" />
									<Button asChild>
										<Link href="/upgrade">Upgrade to Premium</Link>
									</Button>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</div>
		</nav>
	);
}
