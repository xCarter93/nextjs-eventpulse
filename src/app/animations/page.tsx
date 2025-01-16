"use client";

import { useState } from "react";
import { type AnimationTemplate } from "@/types";
import { TemplateCard } from "@/components/animations/TemplateCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Animation from "@/components/animations/LottieAnimation";
import { CustomAnimationUploader } from "@/components/animations/CustomAnimationUploader";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type LottieAnimationProps = React.ComponentProps<typeof Animation>;

export default function AnimationsPage() {
	const [selectedTemplate, setSelectedTemplate] =
		useState<AnimationTemplate | null>(null);

	const baseAnimations = useQuery(api.animations.getBaseAnimations);
	const user = useQuery(api.users.getUser);

	const templates =
		baseAnimations?.map((animation) => ({
			id: animation._id,
			name: animation.name || "Untitled Animation",
			description: animation.description || "",
			previewComponent: (props: LottieAnimationProps) => (
				<Animation {...props} storageId={animation.storageId} />
			),
			createdAt: animation._creationTime,
			isCustom: !animation.isBaseAnimation,
		})) || [];

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Create Animation</h1>
				<p className="mt-2 text-muted-foreground">
					Choose a template and customize your celebration animation
				</p>
			</div>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Choose Template</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{templates.map((template) => (
								<TemplateCard
									key={template.id}
									template={template}
									isSelected={selectedTemplate?.id === template.id}
									onSelect={setSelectedTemplate}
									createdAt={template.createdAt}
									isCustom={template.isCustom}
									userTier={user?.subscription.tier}
								/>
							))}
							<CustomAnimationUploader />
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
