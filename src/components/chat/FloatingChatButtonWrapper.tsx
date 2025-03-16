"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { FloatingChatButton } from "./FloatingChatButton";

export function FloatingChatButtonWrapper() {
	const { isSignedIn } = useUser();
	const pathname = usePathname();
	const isHomePage = pathname === "/" || pathname === "/home";

	// Don't show the chat button on the home page or for non-signed-in users
	if (!isSignedIn || isHomePage) return null;

	return <FloatingChatButton />;
}
