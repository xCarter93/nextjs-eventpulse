"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
	Sparkles,
	Image as ImageIcon,
	Save,
	RefreshCw,
	Trash2,
	Download,
} from "lucide-react";
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

	const handleGenerateImage = async () => {
		if (!prompt.trim()) {
			toast.error("Please enter a prompt");
			return;
		}

		setIsGenerating(true);
		setGeneratedImage(null); // Clear any previous image

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

	const handleDiscard = () => {
		setGeneratedImage(null);
	};

	const handleTryAgain = () => {
		setGeneratedImage(null);
		// Keep the prompt for convenience
	};

	const handleDownload = () => {
		if (!generatedImage) return;

		// Create a temporary anchor element
		const link = document.createElement("a");
		link.href = generatedImage;
		link.download = `ai-generated-${Date.now()}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Skeleton loader for the image
	const ImageSkeleton = () => (
		<div className="relative w-full h-72 rounded-lg overflow-hidden bg-gray-200 dark:bg-neutral-800 animate-pulse">
			<div
				className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-neutral-800 dark:to-neutral-700 animate-shimmer"
				style={{ backgroundSize: "1000px 100%" }}
			></div>
			<div className="absolute inset-0 flex items-center justify-center">
				<Sparkles className="w-12 h-12 text-gray-400 dark:text-gray-600 animate-pulse" />
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
								disabled={isGenerating}
							/>
							<button
								onClick={handleGenerateImage}
								disabled={isGenerating || !prompt.trim()}
								className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
							>
								{isGenerating ? (
									<>
										<Sparkles className="w-5 h-5 animate-pulse" />
										Generating...
									</>
								) : (
									<>
										<ImageIcon className="w-5 h-5" />
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

								{/* Action buttons */}
								{generatedImage && (
									<div className="flex flex-wrap gap-2 justify-center mt-4">
										<button
											onClick={handleSaveImage}
											disabled={isSaving}
											className="flex items-center gap-1 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
										>
											<Save className="w-4 h-4" />
											{isSaving ? "Saving..." : "Save to Gallery"}
										</button>

										<button
											onClick={handleDownload}
											className="flex items-center gap-1 py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
										>
											<Download className="w-4 h-4" />
											Download
										</button>

										<button
											onClick={handleTryAgain}
											className="flex items-center gap-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
										>
											<RefreshCw className="w-4 h-4" />
											Try Again
										</button>

										<button
											onClick={handleDiscard}
											className="flex items-center gap-1 py-2 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
										>
											<Trash2 className="w-4 h-4" />
											Discard
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
