"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Sparkles, Image as ImageIcon, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface AIImageGeneratorProps {
	onSuccess?: () => void;
}

const mainVariant = {
	initial: {
		scale: 1,
	},
	hover: {
		scale: 1.02,
	},
};

const iconVariant = {
	initial: {
		y: 0,
	},
	hover: {
		y: -5,
	},
};

export function AIImageGenerator({ onSuccess }: AIImageGeneratorProps) {
	const saveAnimation = useMutation(api.animations.saveAnimation);
	const generateUploadUrl = useMutation(api.animations.generateUploadUrl);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [generatedImage, setGeneratedImage] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);

	// Reset progress when not generating
	useEffect(() => {
		if (!isGenerating) {
			setProgress(0);
		}
	}, [isGenerating]);

	// Simulate progress when generating
	useEffect(() => {
		let interval: NodeJS.Timeout;

		if (isGenerating) {
			// Start at 0
			setProgress(0);

			// Simulate progress over approximately 15 seconds
			// The progress will go up to 95% and then wait for the actual response
			interval = setInterval(() => {
				setProgress((prev) => {
					if (prev < 95) {
						// Move faster at the beginning, slower as we approach 95%
						const increment = Math.max(1, 10 * (1 - prev / 100));
						return Math.min(95, prev + increment);
					}
					return prev;
				});
			}, 300);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isGenerating]);

	const handleGenerateImage = async () => {
		if (!prompt.trim()) {
			toast.error("Please enter a prompt");
			return;
		}

		setIsGenerating(true);
		setGeneratedImage(null);
		setProgress(0);

		try {
			// Call the API to generate the image
			const response = await fetch("/api/generate-image", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ prompt: prompt.trim() }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error || `Failed to generate image: ${response.statusText}`
				);
			}

			if (!data.imageData) {
				throw new Error("No image data received");
			}

			// Set progress to 100% when image is received
			setProgress(100);
			setGeneratedImage(data.imageData);
		} catch (error) {
			console.error("Error generating image:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to generate image"
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleSaveImage = async () => {
		if (!generatedImage) return;

		setIsSaving(true);
		try {
			// Safely extract the base64 part
			const base64Parts = generatedImage.split(",");
			const base64Data =
				base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];

			if (!base64Data) {
				throw new Error("Invalid base64 data format");
			}

			const byteCharacters = atob(base64Data);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: "image/png" });
			const file = new File([blob], `ai-generated-${Date.now()}.png`, {
				type: "image/png",
			});

			// Upload the generated image
			const fileContent = await file.arrayBuffer();
			const fileBlob = new Blob([fileContent], { type: file.type });

			// Get a short-lived upload URL
			const postUrl = await generateUploadUrl();

			// POST the file to the URL
			const uploadResult = await fetch(postUrl, {
				method: "POST",
				headers: {
					"Content-Type": file.type,
				},
				body: fileBlob,
			});

			if (!uploadResult.ok) {
				throw new Error(
					`Upload failed: ${uploadResult.status} ${uploadResult.statusText}`
				);
			}

			const { storageId } = await uploadResult.json();
			if (!storageId) {
				throw new Error("No storage ID received from upload");
			}

			// Save the animation to the database
			await saveAnimation({
				storageId,
				name: `AI Generated: ${prompt.substring(0, 30)}${prompt.length > 30 ? "..." : ""}`,
				description: prompt,
			});

			toast.success("Image saved successfully");
			setPrompt("");
			setGeneratedImage(null);
			onSuccess?.();
		} catch (error) {
			console.error("Error saving image:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to save image"
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		setGeneratedImage(null);
	};

	// Skeleton loader for the image with progress bar
	const ImageSkeleton = () => (
		<div className="relative w-full h-72 rounded-lg overflow-hidden bg-gray-200 dark:bg-neutral-800">
			<div
				className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-neutral-800 dark:to-neutral-700 animate-shimmer"
				style={{ backgroundSize: "1000px 100%" }}
			></div>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<Sparkles className="w-12 h-12 text-gray-400 dark:text-gray-600 animate-pulse mb-4" />
				<div className="w-3/4 max-w-xs">
					<div className="h-2 w-full bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
							style={{ width: `${progress}%` }}
						></div>
					</div>
					<div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
						{progress < 100
							? `Generating image... ${Math.round(progress)}%`
							: "Processing complete!"}
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="w-full p-6">
			<motion.div
				initial="initial"
				whileHover="hover"
				variants={mainVariant}
				className="relative p-6 md:p-10 group w-full overflow-hidden rounded-lg bg-gray-50 dark:bg-neutral-900"
			>
				<div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] bg-gradient-to-br from-purple-500/20 to-transparent" />

				<div className="relative z-10">
					<div className="flex flex-col items-center justify-center mb-8">
						<motion.div
							variants={iconVariant}
							className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4"
						>
							<ImageIcon className="w-8 h-8 text-purple-500 dark:text-purple-400" />
						</motion.div>
						<h2 className="text-xl font-bold text-foreground">
							Generate AI Image
						</h2>
						<p className="text-sm text-muted-foreground mt-2 text-center">
							Create custom images with AI for your animations
						</p>
					</div>

					{/* Main content with responsive layout */}
					<div className="flex flex-col lg:flex-row gap-8">
						{/* Left side - Prompt input */}
						<div className="w-full lg:w-1/2 flex flex-col">
							<label
								htmlFor="prompt"
								className="text-sm font-medium mb-2 text-foreground"
							>
								Describe your image
							</label>
							<textarea
								id="prompt"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								placeholder="Describe the image you want to generate..."
								className="w-full p-3 border rounded-lg bg-white dark:bg-neutral-800 text-foreground resize-none h-36 mb-4"
								disabled={isGenerating || !!generatedImage}
							/>
							<button
								onClick={handleGenerateImage}
								disabled={isGenerating || !prompt.trim() || !!generatedImage}
								className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
							>
								{isGenerating ? (
									<>
										<Sparkles className="w-5 h-5 animate-pulse inline-block mr-2" />
										Generating...
									</>
								) : (
									<>
										<ImageIcon className="w-5 h-5 inline-block mr-2" />
										Generate Image
									</>
								)}
							</button>

							{/* Prompt tips */}
							<div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
								<h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
									Tips for great prompts:
								</h3>
								<ul className="text-xs text-purple-700 dark:text-purple-400 space-y-1 list-disc pl-4">
									<li>Be specific about what you want to see</li>
									<li>Include details about style, lighting, and mood</li>
									<li>Mention colors, textures, and composition</li>
								</ul>
							</div>
						</div>

						{/* Right side - Image preview */}
						<div className="w-full lg:w-1/2 flex flex-col">
							<div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 h-full">
								<h3 className="text-sm font-medium mb-3 text-foreground">
									{isGenerating
										? "Generating image..."
										: generatedImage
											? "Generated Image"
											: "Image Preview"}
								</h3>

								{isGenerating ? (
									<ImageSkeleton />
								) : generatedImage ? (
									<div className="relative group">
										<div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
										<div className="relative rounded-xl overflow-hidden shadow-xl bg-white dark:bg-neutral-800 p-2">
											<div className="relative w-full h-72 overflow-hidden rounded-lg">
												<Image
													src={generatedImage}
													alt="AI Generated"
													fill
													style={{ objectFit: "contain" }}
													unoptimized
													className="transition-transform duration-500 group-hover:scale-105"
												/>
											</div>
										</div>
									</div>
								) : (
									<div className="w-full h-72 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-700 flex items-center justify-center">
										<div className="text-center p-4">
											<ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
											<p className="text-sm text-gray-500 dark:text-gray-400">
												Enter a prompt and click generate to create an image
											</p>
										</div>
									</div>
								)}

								{/* Action buttons - Simplified to just Save and Cancel */}
								{generatedImage && (
									<div className="flex justify-center gap-4 mt-4">
										<button
											onClick={handleSaveImage}
											disabled={isSaving}
											className="flex items-center gap-2 py-2 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
										>
											<Save className="w-4 h-4" />
											{isSaving ? "Saving..." : "Save to Gallery"}
										</button>

										<button
											onClick={handleCancel}
											className="flex items-center gap-2 py-2 px-6 bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-200 rounded-lg transition-all shadow-md"
										>
											<X className="w-4 h-4" />
											Cancel
										</button>
									</div>
								)}

								{/* Prompt display */}
								{generatedImage && (
									<div className="mt-4 p-3 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-inner">
										<p className="text-sm text-foreground">
											<span className="font-medium">Prompt:</span> &ldquo;
											{prompt}&rdquo;
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
