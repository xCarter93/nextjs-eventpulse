import { type AnimationTemplate } from "@/types";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TemplateCardProps {
	template: AnimationTemplate;
	isSelected: boolean;
	onSelect: (template: AnimationTemplate) => void;
	subscription: "free" | "premium";
}

export function TemplateCard({
	template,
	isSelected,
	onSelect,
	subscription,
}: TemplateCardProps) {
	const isLocked = template.isPremium && subscription === "free";
	const PreviewComponent = template.previewComponent;

	return (
		<Card
			className={`relative cursor-pointer transition-all ${
				isSelected ? "ring-2 ring-primary" : ""
			} ${isLocked ? "opacity-60" : "hover:ring-1 hover:ring-primary/50"}`}
			onClick={() => !isLocked && onSelect(template)}
		>
			<CardContent className="p-4">
				<div className="aspect-video relative rounded-md overflow-hidden mb-3">
					{PreviewComponent ? (
						<div className="flex items-center justify-center w-full h-[180px]">
							<PreviewComponent isPreview={true} />
						</div>
					) : template.previewUrl ? (
						<Image
							src={template.previewUrl}
							alt={template.name}
							fill
							className="object-cover"
						/>
					) : null}
					{isLocked && (
						<div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
							<span className="text-muted-foreground font-semibold">
								Premium Only
							</span>
						</div>
					)}
				</div>
				<h3 className="font-semibold text-card-foreground">{template.name}</h3>
				<p className="text-sm text-muted-foreground">{template.description}</p>
				{template.isPremium && (
					<Badge variant="secondary" className="absolute top-2 right-2">
						Premium
					</Badge>
				)}
			</CardContent>
		</Card>
	);
}
