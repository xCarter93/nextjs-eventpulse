"use client";

import { Id } from "../../../convex/_generated/dataModel";
import LottieAnimation from "../animations/LottieAnimation";
import Link from "next/link";

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
		<div className="flex flex-col items-center gap-8 p-6 font-sans text-[#484848] max-w-[600px] mx-auto">
			{heading && (
				<h2 className="text-3xl font-bold leading-[1.3] text-center w-full">
					{heading}
				</h2>
			)}
			<div className="w-full my-8 text-center">
				{animationId && (
					<div className="relative w-full aspect-square max-w-[400px] mx-auto">
						<LottieAnimation
							storageId={animationId as unknown as Id<"_storage">}
						/>
					</div>
				)}
				{!animationId && (
					<div className="w-full aspect-square max-w-[400px] mx-auto bg-muted rounded-md flex items-center justify-center text-muted-foreground">
						Select an animation to preview
					</div>
				)}
			</div>
			{body && (
				<p className="text-lg leading-[1.6] text-center w-full">{body}</p>
			)}
			{!heading && !body && (
				<p className="text-muted-foreground text-center">
					Start filling out the form to see a preview of your email
				</p>
			)}
			<div className="w-full text-center text-sm text-[#666666] mt-8 pt-6 border-t border-[#eaeaea]">
				Sent with ❤️ from{" "}
				<Link
					href="https://animgreet.com"
					className="text-black no-underline font-medium"
				>
					AnimGreet
				</Link>
			</div>
		</div>
	);
}
