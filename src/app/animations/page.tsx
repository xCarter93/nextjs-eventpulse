"use client";

import { useState } from "react";
import { type AnimationTemplate } from "@/types";
import { TemplateCard } from "@/components/animations/TemplateCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomAnimationUploader } from "@/components/animations/CustomAnimationUploader";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AnimationsPage() {
	const [selectedTemplate, setSelectedTemplate] =
		useState<AnimationTemplate | null>(null);

	const baseAnimations = useQuery(api.animations.getBaseAnimations);
	const user = useQuery(api.users.getUser);

	const templates: AnimationTemplate[] =
		baseAnimations?.map((animation) => ({
			id: animation._id,
			name: animation.name || "Untitled Animation",
			description: animation.description || "",
			previewUrl: animation.url,
			createdAt: animation._creationTime,
			isCustom: !animation.isBaseAnimation,
		})) || [];

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-foreground">
					Custom Animations & Images
				</h1>
				<p className="mt-2 text-muted-foreground">
					Upload and manage your custom GIFs and images for email greetings
				</p>
			</div>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Your Uploads</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animations-grid">
							{templates.map((template) => (
								<TemplateCard
									key={template.id}
									template={template}
									isSelected={selectedTemplate?.id === template.id}
									onSelect={setSelectedTemplate}
									createdAt={template.createdAt}
									isCustom={template.isCustom}
									userTier={user?.subscription.tier as "pro" | "free"}
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
