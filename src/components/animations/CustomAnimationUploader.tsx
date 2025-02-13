"use client";

import { type ChangeEvent, useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";

interface CustomAnimationUploaderProps {
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

export function CustomAnimationUploader({
	onSuccess,
}: CustomAnimationUploaderProps) {
	const generateUploadUrl = useMutation(api.animations.generateUploadUrl);
	const saveAnimation = useMutation(api.animations.saveAnimation);
	const user = useQuery(api.users.getUser);
	const [isUploading, setIsUploading] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		e.stopPropagation();
		const file = e.target.files?.[0];
		if (!file) return;

		// Verify file is an accepted image type
		if (!file.type.match(/^image\/(gif|jpeg|png)$/)) {
			toast.error("Please upload a GIF, JPG, or PNG file");
			return;
		}

		setSelectedFile(file);
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
			setSelectedFile(null);
			onSuccess?.();
		} catch (error) {
			console.error("Error uploading animation:", error);
			toast.error("Failed to upload animation");
		} finally {
			setIsUploading(false);
		}
	};

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="w-full p-6">
			<motion.div
				initial="initial"
				whileHover="hover"
				variants={mainVariant}
				onClick={handleClick}
				className="relative p-10 group cursor-pointer w-full overflow-hidden rounded-lg bg-gray-50 dark:bg-neutral-900"
			>
				<div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] bg-gradient-to-br from-purple-500/20 to-transparent" />

				<div className="flex flex-col items-center justify-center relative z-10">
					<motion.div
						variants={iconVariant}
						className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4"
					>
						<Upload
							className={`w-8 h-8 text-purple-500 dark:text-purple-400 ${
								isUploading ? "animate-bounce" : ""
							}`}
						/>
					</motion.div>
					<p className="font-medium text-foreground">
						{isUploading ? "Uploading..." : "Upload Animation"}
					</p>
					<p className="text-sm text-muted-foreground mt-2 text-center">
						Click to upload your custom GIF, JPG, or PNG
					</p>

					<input
						ref={fileInputRef}
						type="file"
						accept=".gif,.jpg,.jpeg,.png"
						onChange={handleFileChange}
						className="hidden"
					/>

					{selectedFile && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="mt-6 w-full max-w-md bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm"
						>
							<div className="flex justify-between items-center gap-4">
								<p className="text-sm text-foreground truncate">
									{selectedFile.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
								</p>
							</div>
						</motion.div>
					)}

					{user?.subscription.tier === "free" && (
						<div className="mt-6 text-center">
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
						</div>
					)}

					<div className="mt-4">
						<a
							href="https://lottiefiles.com/featured-free-animations"
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-primary hover:underline block text-center"
						>
							Browse free animations at LottieFiles
						</a>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
