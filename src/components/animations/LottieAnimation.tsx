"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Image from "next/image";

interface AnimationProps {
	isPreview?: boolean;
	src?: string;
	storageId?: Id<"_storage">;
}

export default function Animation({
	isPreview,
	src,
	storageId,
}: AnimationProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const queryResult = useQuery(
		api.animations.getAnimationUrl,
		storageId ? { storageId } : "skip"
	);

	useEffect(() => {
		if (storageId) {
			setIsLoading(true);
			setError(null);
			if (queryResult === undefined) {
				setIsLoading(true);
			} else if (queryResult === null) {
				setError("Failed to load animation");
				setIsLoading(false);
			} else {
				setIsLoading(false);
			}
		} else if (src) {
			setIsLoading(false);
			setError(null);
		}
	}, [storageId, queryResult, src]);

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

	const animationUrl = queryResult || src || "/images/default-animation.gif";

	return (
		<div
			className={`relative flex items-center justify-center w-full h-full ${
				isPreview ? "scale-75" : ""
			}`}
		>
			<Image
				src={animationUrl}
				alt="Animation"
				width={400}
				height={400}
				className="w-full h-full object-contain"
			/>
		</div>
	);
}
