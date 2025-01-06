"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LottieAnimationProps {
	isPreview?: boolean;
	src?: string;
}

export default function LottieAnimation({
	isPreview,
	src,
}: LottieAnimationProps) {
	return (
		<div
			className={`relative flex items-center justify-center w-full h-full ${
				isPreview ? "scale-75" : ""
			}`}
		>
			<DotLottieReact
				src={src || "/lottiefiles/Animation - 1736125012323.lottie"}
				loop
				autoplay
				className="w-full h-full"
			/>
		</div>
	);
}
