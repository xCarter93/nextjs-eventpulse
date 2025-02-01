"use client";

import { type AnimationTemplate } from "@/types";
import {
	Card,
	CardBody,
	CardHeader,
	CardFooter,
	Button,
	Modal,
	ModalContent,
	ModalHeader,
	Image as HeroImage,
} from "@heroui/react";
import { useState } from "react";
import NextImage from "next/image";
import { Trash2, Eye } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface TemplateCardProps {
	template: AnimationTemplate;
	isSelected: boolean;
	onSelect: (template: AnimationTemplate) => void;
	createdAt?: number;
	isCustom?: boolean;
	userTier?: "free" | "pro";
}

export function TemplateCard({
	template,
	isSelected,
	onSelect,
	createdAt,
	isCustom,
	userTier,
}: TemplateCardProps) {
	const [showPreview, setShowPreview] = useState(false);
	const PreviewComponent = template.previewComponent;
	const deleteAnimation = useMutation(api.animations.deleteUserAnimation);

	// Calculate days until deletion for free tier users
	const getDaysUntilDeletion = () => {
		if (!createdAt || !isCustom || userTier !== "free") return null;
		const creationDate = new Date(createdAt);
		const deletionDate = new Date(
			creationDate.getTime() + 10 * 24 * 60 * 60 * 1000
		); // 10 days
		const daysLeft = Math.ceil(
			(deletionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
		);
		return daysLeft;
	};

	const daysUntilDeletion = getDaysUntilDeletion();

	const handleDelete = async () => {
		try {
			await deleteAnimation({ id: template.id });
			toast.success("Animation deleted successfully");
		} catch (error) {
			toast.error("Failed to delete animation");
			console.error(error);
		}
	};

	return (
		<>
			<Card
				isPressable
				isHoverable
				shadow="sm"
				className={`relative overflow-hidden transition-all max-w-sm ${
					isSelected ? "ring-2 ring-primary" : ""
				}`}
				onPress={() => onSelect(template)}
			>
				<CardHeader className="pb-2">
					<div className="flex justify-between items-start">
						<div>
							<h3 className="text-lg font-semibold">{template.name}</h3>
							{createdAt && (
								<p className="text-xs text-muted-foreground">
									Uploaded {format(new Date(createdAt), "MMM d, yyyy")}
								</p>
							)}
						</div>
					</div>
				</CardHeader>

				<CardBody className="px-4 py-2">
					<div className="w-full aspect-video relative">
						{PreviewComponent ? (
							<PreviewComponent isPreview />
						) : (
							template.previewUrl && (
								<HeroImage
									as={NextImage}
									src={template.previewUrl}
									alt={template.name}
									width={480}
									height={270}
									className="w-full h-full object-cover"
									radius="lg"
									sizes="(max-width: 768px) 100vw, 480px"
								/>
							)
						)}
					</div>
					<div className="text-sm text-muted-foreground mt-2">
						{template.description}
					</div>
					{daysUntilDeletion !== null && daysUntilDeletion > 0 && (
						<p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
							Will be deleted in {daysUntilDeletion} days
						</p>
					)}
				</CardBody>

				<CardFooter className="px-4 py-3 justify-between">
					<Button
						size="sm"
						variant="flat"
						onPress={() => setShowPreview(true)}
						startContent={<Eye className="h-4 w-4" />}
					>
						Preview
					</Button>
					{isCustom && (
						<Button
							size="sm"
							variant="ghost"
							color="danger"
							onPress={handleDelete}
							startContent={<Trash2 className="h-4 w-4" />}
						>
							Delete
						</Button>
					)}
				</CardFooter>
			</Card>

			<Modal
				isOpen={showPreview}
				onClose={() => setShowPreview(false)}
				size="3xl"
			>
				<ModalContent>
					<ModalHeader>
						<h3 className="text-lg font-semibold">{template.name} Preview</h3>
					</ModalHeader>
					<div className="w-full aspect-video relative">
						{PreviewComponent ? (
							<PreviewComponent />
						) : (
							template.previewUrl && (
								<HeroImage
									as={NextImage}
									src={template.previewUrl}
									alt={template.name}
									width={1280}
									height={720}
									className="w-full h-full object-cover"
									radius="lg"
									sizes="(max-width: 1280px) 100vw, 1280px"
								/>
							)
						)}
					</div>
				</ModalContent>
			</Modal>
		</>
	);
}
