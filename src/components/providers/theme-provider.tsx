"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	return (
		<NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
			<HeroUIProvider>{children}</HeroUIProvider>
		</NextThemesProvider>
	);
}
