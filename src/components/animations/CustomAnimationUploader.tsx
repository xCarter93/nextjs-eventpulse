"use client";

import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import LottieAnimation from "./LottieAnimation";

interface CustomAnimationUploaderProps {
	isPreview?: boolean;
}

export function CustomAnimationUploader({
	isPreview,
}: CustomAnimationUploaderProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		e.stopPropagation();
		const file = e.target.files?.[0];
		if (!file) return;

		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
	};

	if (previewUrl) {
		return <LottieAnimation isPreview={isPreview} src={previewUrl} />;
	}

	return (
		<div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
			<Input
				type="file"
				accept=".json,.lottie"
				onChange={handleFileChange}
				onClick={(e) => e.stopPropagation()}
				className="max-w-[200px]"
			/>
			<p className="text-sm text-muted-foreground text-center">
				Upload a .lottie or .json file
			</p>
		</div>
	);
}
