"use client";

import { type AnimationTemplate } from "@/types";
import {
	Card,
	CardBody,
	Button,
	Modal,
	ModalContent,
	ModalHeader,
	Image as HeroImage,
} from "@heroui/react";
import { useState } from "react";
import NextImage from "next/image";
import { Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

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
				className={`relative overflow-hidden transition-all ${
					isSelected ? "ring-2 ring-primary" : ""
				}`}
				onPress={() => onSelect(template)}
			>
				{isCustom && (
					<Button
						isIconOnly
						variant="ghost"
						size="sm"
						className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background/90"
						onPress={handleDelete}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				)}
				<CardBody className="p-4">
					<div
						className="aspect-video mb-4 overflow-hidden relative"
						onClick={(e) => {
							e.stopPropagation();
							setShowPreview(true);
						}}
					>
						{PreviewComponent ? (
							<PreviewComponent isPreview />
						) : (
							template.previewUrl && (
								<HeroImage
									as={NextImage}
									src={template.previewUrl}
									alt={template.name}
									fill
									className="object-cover"
									isZoomed
									radius="lg"
								/>
							)
						)}
					</div>
					<h3 className="font-semibold">{template.name}</h3>
					<div className="text-sm text-muted-foreground">
						{template.description}
					</div>
					{daysUntilDeletion !== null && daysUntilDeletion > 0 && (
						<p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
							Will be deleted in {daysUntilDeletion} days
						</p>
					)}
				</CardBody>
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
					<div className="aspect-video relative p-6">
						{PreviewComponent ? (
							<PreviewComponent />
						) : (
							template.previewUrl && (
								<HeroImage
									as={NextImage}
									src={template.previewUrl}
									alt={template.name}
									fill
									className="object-cover"
									radius="lg"
								/>
							)
						)}
					</div>
				</ModalContent>
			</Modal>
		</>
	);
}
