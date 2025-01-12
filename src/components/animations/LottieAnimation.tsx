"use client";

import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface LottieAnimationProps {
	isPreview?: boolean;
	src?: string;
	storageId?: Id<"_storage">;
}

export default function LottieAnimation({
	isPreview,
	src,
	storageId,
}: LottieAnimationProps) {
	const [animationUrl, setAnimationUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const getAnimationUrl = useMutation(api.animations.getAnimationUrl);

	useEffect(() => {
		if (storageId) {
			setIsLoading(true);
			setError(null);
			getAnimationUrl({ storageId })
				.then((url) => {
					setAnimationUrl(url);
					setIsLoading(false);
				})
				.catch((err) => {
					console.error("Error loading animation:", err);
					setError("Failed to load animation");
					setIsLoading(false);
				});
		}
	}, [storageId, getAnimationUrl]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center w-full h-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center w-full h-full text-red-500">
				{error}
			</div>
		);
	}

	return (
		<div
			className={`relative flex items-center justify-center w-full h-full ${
				isPreview ? "scale-75" : ""
			}`}
		>
			<DotLottieReact
				src={
					animationUrl || src || "/lottiefiles/Animation - 1736125012323.lottie"
				}
				loop
				autoplay
				className="w-full h-full"
				onError={(error) => {
					console.error("Lottie animation error:", error);
					setError("Failed to play animation");
				}}
			/>
		</div>
	);
}
