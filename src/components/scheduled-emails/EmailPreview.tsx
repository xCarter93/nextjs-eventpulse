"use client";

import { Id } from "../../../convex/_generated/dataModel";
import Animation from "../animations/LottieAnimation";

interface EmailPreviewProps {
	heading?: string;
	animationId?: string;
	animationUrl?: string;
	body?: string;
}

export function EmailPreview({
	heading,
	animationId,
	animationUrl,
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
				{animationId || animationUrl ? (
					<div className="relative w-full aspect-square max-w-[400px] mx-auto">
						<Animation
							storageId={animationId as unknown as Id<"_storage">}
							src={animationUrl}
						/>
					</div>
				) : (
					<div className="w-full aspect-square max-w-[400px] mx-auto bg-muted rounded-md flex items-center justify-center text-muted-foreground">
						Select an animation or enter a URL to preview
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
				<p className="text-sm text-gray-500 mt-4 pt-4 border-t">
					Sent with ❤️ from{" "}
					<a
						href="https://eventpulse.com"
						className="text-blue-600 hover:text-blue-800"
					>
						EventPulse
					</a>
				</p>
			</div>
		</div>
	);
}
