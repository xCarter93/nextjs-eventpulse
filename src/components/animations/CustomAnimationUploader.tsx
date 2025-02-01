"use client";

import { type ChangeEvent, useState } from "react";
import { Card, CardBody, Input } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";

export function CustomAnimationUploader() {
	const generateUploadUrl = useMutation(api.animations.generateUploadUrl);
	const saveAnimation = useMutation(api.animations.saveAnimation);
	const user = useQuery(api.users.getUser);
	const [isUploading, setIsUploading] = useState(false);

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		e.stopPropagation();
		const file = e.target.files?.[0];
		if (!file) return;

		// Verify file is an accepted image type
		if (!file.type.match(/^image\/(gif|jpeg|png)$/)) {
			toast.error("Please upload a GIF, JPG, or PNG file");
			return;
		}

		setIsUploading(true);
		try {
			// Read the file content
			const fileContent = await file.arrayBuffer();
			const fileBlob = new Blob([fileContent], { type: file.type });

			// Step 1: Get a short-lived upload URL
			const postUrl = await generateUploadUrl();

			// Step 2: POST the file to the URL
			const result = await fetch(postUrl, {
				method: "POST",
				headers: {
					"Content-Type": file.type,
				},
				body: fileBlob,
			});

			if (!result.ok) {
				throw new Error(`Upload failed: ${result.status} ${result.statusText}`);
			}

			const { storageId } = await result.json();
			if (!storageId) {
				throw new Error("No storage ID received from upload");
			}

			// Step 3: Save the animation to the database
			await saveAnimation({
				storageId: storageId as Id<"_storage">,
				name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
				description: "Custom uploaded animation",
			});

			toast.success("Animation uploaded successfully");
		} catch (error) {
			console.error("Error uploading animation:", error);
			toast.error("Failed to upload animation");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Card shadow="sm" className="transition-all hover:shadow-md sticky top-8">
			<CardBody className="p-4">
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<Upload
							className={`w-8 h-8 text-muted-foreground ${isUploading ? "animate-bounce" : ""}`}
						/>
						<div>
							<h3 className="font-semibold">
								{isUploading ? "Uploading..." : "Custom Animation"}
							</h3>
							<p className="text-sm text-muted-foreground">
								Upload your custom GIF, JPG, or PNG
							</p>
						</div>
					</div>

					<Input
						type="file"
						accept=".gif,.jpg,.jpeg,.png"
						onChange={handleFileChange}
						variant="faded"
						radius="lg"
						size="sm"
						isDisabled={isUploading}
						description={
							<div className="space-y-2 mt-2">
								{user?.subscription.tier === "free" && (
									<p className="text-xs text-yellow-600 dark:text-yellow-500">
										Note: On the free plan, custom animations are automatically
										deleted after 10 days.{" "}
										<Link
											href="/billing"
											className="underline hover:text-yellow-700 dark:hover:text-yellow-400"
										>
											Upgrade to keep them permanently
										</Link>
									</p>
								)}
								<div>
									<a
										href="https://lottiefiles.com/featured-free-animations"
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs text-primary hover:underline block"
									>
										Browse free animations at LottieFiles
									</a>
								</div>
							</div>
						}
						startContent={
							<div className="pointer-events-none">
								<Upload className="text-default-400 w-4 h-4" />
							</div>
						}
					/>
				</div>
			</CardBody>
		</Card>
	);
}
