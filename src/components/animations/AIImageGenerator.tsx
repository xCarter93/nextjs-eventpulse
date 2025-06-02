"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Sparkles, Image as ImageIcon, Save, X, Wand2, Lightbulb } from "lucide-react";
import NextImage from "next/image";
import {
	Card,
	CardBody,
	CardHeader,
	Button,
	Textarea,
	Progress,
	Chip,
	Image,
	Spacer
} from "@heroui/react";

interface AIImageGeneratorProps {
	onSuccess?: () => void;
}

interface ImageMetadata {
	originalPrompt: string;
	enhancedPrompt: string;
	generationTime: number;
	size: string;
	quality: string;
	timestamp: string;
}

export function AIImageGenerator({ onSuccess }: AIImageGeneratorProps) {
	const saveAnimation = useMutation(api.animations.saveAnimation);
	const generateUploadUrl = useMutation(api.animations.generateUploadUrl);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [generatedImage, setGeneratedImage] = useState<string | null>(null);
	const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
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
			setImageMetadata(data.metadata || null);
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
			setImageMetadata(null);
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
		setImageMetadata(null);
	};

	// Modern skeleton loader with HeroUI components
	const ImageSkeleton = () => (
		<Card className="w-full h-80 bg-gradient-to-br from-default-50 to-default-100">
			<CardBody className="flex flex-col items-center justify-center space-y-6 p-8">
				<div className="p-4 rounded-full bg-gradient-to-br from-secondary-200 to-primary-200">
					<Wand2 className="w-8 h-8 text-primary-600 animate-pulse" />
				</div>
				<div className="w-full max-w-sm space-y-3">
					<Progress
						value={progress}
						color="secondary"
						size="md"
						className="max-w-md"
						classNames={{
							track: "bg-default-200",
							indicator: "bg-gradient-to-r from-secondary-500 to-primary-500"
						}}
					/>
					<div className="text-center space-y-1">
						<p className="text-sm font-medium text-default-700">
							{progress < 100 ? "Creating your masterpiece..." : "Almost ready!"}
						</p>
						<p className="text-xs text-default-500">
							{Math.round(progress)}% complete
						</p>
					</div>
				</div>
			</CardBody>
		</Card>
	);

	return (
		<div className="w-full max-w-7xl mx-auto p-6">
			<Card className="bg-gradient-to-br from-background to-default-50 shadow-xl border-none">
				<CardHeader className="flex flex-col items-center text-center pb-2">
					<div className="p-3 rounded-2xl bg-gradient-to-br from-secondary-500 to-primary-500 mb-4">
						<Wand2 className="w-8 h-8 text-white" />
					</div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
						AI Image Generator
					</h1>
					<p className="text-default-600 text-lg max-w-2xl">
						Transform your ideas into stunning visuals with cutting-edge AI technology
					</p>
					<Chip
						color="secondary"
						variant="flat"
						startContent={<Sparkles className="w-3 h-3" />}
						className="mt-3"
					>
						Powered by DALL-E 3
					</Chip>
				</CardHeader>

				<CardBody className="px-6 pb-6">

					{/* Modern grid layout */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Left side - Enhanced prompt input */}
						<div className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center gap-2 mb-2">
									<ImageIcon className="w-5 h-5 text-default-600" />
									<h3 className="text-lg font-semibold text-default-700">Describe Your Vision</h3>
								</div>
								<Textarea
									label="Image Description"
									placeholder="A breathtaking mountain landscape at golden hour with dramatic clouds, vibrant sunset colors, and misty valleys..."
									value={prompt}
									onValueChange={setPrompt}
									minRows={4}
									maxRows={6}
									variant="bordered"
									color="primary"
									disabled={isGenerating || !!generatedImage}
									classNames={{
										input: "text-base",
										label: "text-sm font-medium"
									}}
									description={`${prompt.length}/500 characters`}
								/>
								
								<Button
									onPress={handleGenerateImage}
									isDisabled={isGenerating || !prompt.trim() || !!generatedImage}
									color="secondary"
									size="lg"
									variant="shadow"
									className="w-full bg-gradient-to-r from-secondary-500 to-primary-500 text-white font-semibold"
									startContent={
										isGenerating ? (
											<Sparkles className="w-5 h-5 animate-spin" />
										) : (
											<Wand2 className="w-5 h-5" />
										)
									}
								>
									{isGenerating ? "Generating..." : "Generate Image"}
								</Button>

							</div>
							
							{/* Enhanced tips section */}
							<Card className="bg-gradient-to-br from-secondary-50 to-primary-50 border-secondary-200">
								<CardHeader className="pb-2">
									<div className="flex items-center gap-2">
										<Lightbulb className="w-4 h-4 text-secondary-600" />
										<h4 className="text-sm font-semibold text-secondary-700">Pro Tips</h4>
									</div>
								</CardHeader>
								<CardBody className="pt-0">
									<div className="space-y-2 text-xs text-secondary-600">
										<div className="flex items-start gap-2">
											<span className="text-secondary-500 font-bold">•</span>
											<span>Be specific about style, mood, and composition</span>
										</div>
										<div className="flex items-start gap-2">
											<span className="text-secondary-500 font-bold">•</span>
											<span>Include lighting, atmosphere, and color details</span>
										</div>
										<div className="flex items-start gap-2">
											<span className="text-secondary-500 font-bold">•</span>
											<span>Mention artistic styles or techniques</span>
										</div>
									</div>
								</CardBody>
							</Card>
						</div>

						{/* Right side - Enhanced preview area */}
						<div className="space-y-4">
							<div className="text-center">
								<h3 className="text-lg font-semibold text-default-700 mb-2">
									{isGenerating
										? "Creating your masterpiece..."
										: generatedImage
											? "Your AI Creation"
											: "Preview Area"}
								</h3>
							</div>

							{isGenerating ? (
								<ImageSkeleton />
							) : generatedImage ? (
								<div className="relative">
									<div className="absolute -inset-1 bg-gradient-to-r from-secondary-500 via-primary-500 to-secondary-500 rounded-2xl blur-sm opacity-75 animate-pulse"></div>
									<Card className="relative shadow-2xl border-none">
										<CardBody className="p-3">
											<Image
												as={NextImage}
												src={generatedImage}
												alt="AI Generated Image"
												width={400}
												height={400}
												className="w-full h-80 object-contain"
												radius="lg"
												unoptimized
											/>
										</CardBody>
									</Card>
								</div>
							) : (
								<Card className="h-80 border-2 border-dashed border-default-300 bg-default-50">
									<CardBody className="flex flex-col items-center justify-center text-center space-y-4">
										<div className="p-4 rounded-full bg-default-100">
											<ImageIcon className="w-8 h-8 text-default-400" />
										</div>
										<div className="space-y-2 max-w-xs">
											<h4 className="text-sm font-medium text-default-600">
												Ready to create something amazing?
											</h4>
											<p className="text-xs text-default-500">
												Enter a detailed prompt and let AI bring your vision to life
											</p>
										</div>
									</CardBody>
								</Card>
							)}

							{/* Enhanced action buttons */}
							{generatedImage && (
								<>
									<Spacer y={4} />
									<div className="flex flex-col sm:flex-row justify-center gap-3">
										<Button
											onPress={handleSaveImage}
											isDisabled={isSaving}
											color="success"
											size="lg"
											variant="shadow"
											startContent={<Save className="w-4 h-4" />}
											className="bg-gradient-to-r from-success-500 to-success-600 text-white font-semibold flex-1 sm:flex-initial"
										>
											{isSaving ? "Saving..." : "Save to Gallery"}
										</Button>

										<Button
											onPress={handleCancel}
											variant="bordered"
											size="lg"
											startContent={<X className="w-4 h-4" />}
											className="flex-1 sm:flex-initial"
										>
											Start Over
										</Button>
									</div>
								</>
							)}

							{/* Enhanced prompt display with metadata */}
							{generatedImage && (
								<>
									<Spacer y={4} />
									<Card className="bg-default-50 border-default-200">
										<CardBody className="p-4 space-y-3">
											<div className="flex items-start gap-3">
												<div className="p-2 rounded-lg bg-secondary-100 flex-shrink-0">
													<Sparkles className="w-4 h-4 text-secondary-600" />
												</div>
												<div className="flex-1">
													<p className="text-xs font-medium text-default-600 mb-1">Your original prompt:</p>
													<p className="text-sm text-default-700 italic">
														&ldquo;{prompt}&rdquo;
													</p>
													{imageMetadata?.enhancedPrompt && imageMetadata.enhancedPrompt !== prompt && (
														<>
															<p className="text-xs font-medium text-default-600 mb-1 mt-3">AI-enhanced prompt:</p>
															<p className="text-xs text-default-600 bg-secondary-50 p-2 rounded border">
																&ldquo;{imageMetadata.enhancedPrompt}&rdquo;
															</p>
														</>
													)}
												</div>
											</div>
											{imageMetadata?.generationTime && (
												<div className="flex items-center gap-2 text-xs text-default-500">
													<span>•</span>
													<span>Generated in {(imageMetadata.generationTime / 1000).toFixed(1)}s</span>
													<span>•</span>
													<span>Size: {imageMetadata.size || "1024x1024"}</span>
												</div>
											)}
										</CardBody>
									</Card>
								</>
							)}
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);
}
