"use client";

import { type AnimationTemplate } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
			creationDate.getTime() + 30 * 24 * 60 * 60 * 1000
		); // 30 days
		const daysLeft = Math.ceil(
			(deletionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
		);
		return daysLeft;
	};

	const daysUntilDeletion = getDaysUntilDeletion();

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation();
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
				className={`relative overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
					isSelected ? "ring-2 ring-primary" : ""
				}`}
				onClick={() => onSelect(template)}
			>
				{isCustom && (
					<Button
						variant="ghost"
						size="icon"
						className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background/90"
						onClick={handleDelete}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				)}
				<CardContent className="p-4">
					<div
						className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden relative"
						onClick={(e) => {
							e.stopPropagation();
							setShowPreview(true);
						}}
					>
						{PreviewComponent ? (
							<PreviewComponent isPreview />
						) : (
							template.previewUrl && (
								<Image
									src={template.previewUrl}
									alt={template.name}
									fill
									className="object-cover"
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
				</CardContent>
			</Card>

			<Dialog open={showPreview} onOpenChange={setShowPreview}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>{template.name} Preview</DialogTitle>
					</DialogHeader>
					<div className="aspect-video relative">
						{PreviewComponent ? (
							<PreviewComponent />
						) : (
							template.previewUrl && (
								<Image
									src={template.previewUrl}
									alt={template.name}
									fill
									className="object-cover"
								/>
							)
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
