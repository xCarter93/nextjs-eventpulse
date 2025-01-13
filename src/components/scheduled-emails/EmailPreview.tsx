"use client";

import { Id } from "../../../convex/_generated/dataModel";
import LottieAnimation from "../animations/LottieAnimation";

interface EmailPreviewProps {
	heading?: string;
	animationId?: string;
	body?: string;
}

export function EmailPreview({
	heading,
	animationId,
	body,
}: EmailPreviewProps) {
	return (
		<div className="flex flex-col items-center gap-8 p-6 font-sans text-[#484848]">
			{heading && (
				<h2 className="text-3xl font-bold leading-snug text-center">
					{heading}
				</h2>
			)}
			{animationId && (
				<div className="relative w-full aspect-square max-w-[400px]">
					<LottieAnimation
						storageId={animationId as unknown as Id<"_storage">}
					/>
				</div>
			)}
			{!animationId && (
				<div className="w-full aspect-square max-w-[400px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
					Select an animation to preview
				</div>
			)}
			{body && <p className="text-lg leading-relaxed text-center">{body}</p>}
			{!heading && !body && (
				<p className="text-muted-foreground text-center">
					Start filling out the form to see a preview of your email
				</p>
			)}
		</div>
	);
}
