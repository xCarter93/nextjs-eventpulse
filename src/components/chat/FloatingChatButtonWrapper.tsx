"use client";

import { useUser } from "@clerk/nextjs";
import { FloatingChatButton } from "./FloatingChatButton";

export function FloatingChatButtonWrapper() {
	const { isSignedIn } = useUser();

	// Only show the chat button for signed-in users
	if (!isSignedIn) return null;

	return <FloatingChatButton />;
}
