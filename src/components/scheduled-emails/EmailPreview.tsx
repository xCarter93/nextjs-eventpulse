"use client";

import { Id } from "../../../convex/_generated/dataModel";
import Animation from "../animations/LottieAnimation";
import { type ColorScheme } from "@/types";

interface EmailPreviewProps {
	heading?: string;
	animationId?: string;
	animationUrl?: string;
	body?: string;
	colorScheme?: ColorScheme;
}

export function EmailPreview({
	heading,
	animationId,
	animationUrl,
	body,
	colorScheme,
}: EmailPreviewProps) {
	const previewStyle = {
		backgroundColor: colorScheme?.background || "#F3F4F6",
	};

	const headingStyle = {
		color: colorScheme?.primary || "#484848",
	};

	const bodyStyle = {
		color: colorScheme?.secondary || "#484848",
	};

	const footerStyle = {
		borderColor: colorScheme?.accent || "#eaeaea",
		color: colorScheme?.secondary || "#666666",
	};

	return (
		<div
			className="flex flex-col items-center gap-8 p-6 font-sans max-w-[600px] mx-auto rounded-lg"
			style={previewStyle}
		>
			{heading && (
				<h2
					className="text-3xl font-bold leading-[1.3] text-center w-full"
					style={headingStyle}
				>
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
				<p
					className="text-lg leading-[1.6] text-center w-full"
					style={bodyStyle}
				>
					{body}
				</p>
			)}
			{!heading && !body && (
				<p className="text-muted-foreground text-center">
					Start filling out the form to see a preview of your email
				</p>
			)}
			<div
				className="w-full text-center text-sm mt-8 pt-6 border-t"
				style={footerStyle}
			>
				<p className="text-sm mt-4 pt-4 border-t" style={footerStyle}>
					Sent with ❤️ from{" "}
					<a
						href="https://eventpulse.com"
						className="hover:text-blue-800"
						style={{ color: colorScheme?.primary || "#3B82F6" }}
					>
						EventPulse
					</a>
				</p>
			</div>
		</div>
	);
}
