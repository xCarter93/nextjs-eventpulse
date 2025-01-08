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

interface TemplateCardProps {
	template: AnimationTemplate;
	isSelected: boolean;
	onSelect: (template: AnimationTemplate) => void;
}

export function TemplateCard({
	template,
	isSelected,
	onSelect,
}: TemplateCardProps) {
	const [showPreview, setShowPreview] = useState(false);
	const PreviewComponent = template.previewComponent;

	return (
		<>
			<Card
				className={`relative overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
					isSelected ? "ring-2 ring-primary" : ""
				}`}
				onClick={() => onSelect(template)}
			>
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
