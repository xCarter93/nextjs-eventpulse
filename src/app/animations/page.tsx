"use client";

import { useState } from "react";
import { type AnimationTemplate } from "@/types";
import { TemplateCard } from "@/components/animations/TemplateCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomAnimationUploader } from "@/components/animations/CustomAnimationUploader";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Image, Upload, Sparkles, FileImage } from "lucide-react";

function EmptyState() {
	return (
		<div className="col-span-full min-h-[400px] flex items-center justify-center">
			<div className="text-center space-y-6 max-w-md mx-auto p-6">
				<div className="relative">
					<div className="grid grid-cols-2 gap-4 mb-4">
						{[Image, Upload, Sparkles, FileImage].map((Icon, i) => (
							<div
								key={i}
								className="p-4 bg-muted/40 rounded-xl group hover:bg-primary/5 transition-all duration-300"
							>
								<Icon
									className="w-8 h-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300"
									strokeWidth={1.5}
								/>
							</div>
						))}
					</div>
					<div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none" />
				</div>
				<div>
					<h3 className="text-lg font-semibold text-foreground mb-2">
						No animations yet
					</h3>
					<p className="text-sm text-muted-foreground">
						Upload your first animation using the uploader on the right. You can
						use GIFs, JPGs, or PNGs to create custom animations.
					</p>
				</div>
			</div>
		</div>
	);
}

export default function AnimationsPage() {
	const [selectedTemplate, setSelectedTemplate] =
		useState<AnimationTemplate | null>(null);

	const userAnimations = useQuery(api.animations.getUserAnimations);
	const user = useQuery(api.users.getUser);

	const templates: AnimationTemplate[] =
		userAnimations?.map((animation) => ({
			id: animation._id,
			name: animation.name || "Untitled Animation",
			description: animation.description || "",
			previewUrl: animation.url,
			createdAt: animation._creationTime,
			isCustom: !animation.isBaseAnimation,
		})) || [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">
					Custom Animations & Images
				</h1>
				<p className="mt-2 text-muted-foreground">
					Upload and manage your custom GIFs and images for email greetings
				</p>
			</div>

			<div className="flex flex-col lg:flex-row gap-6">
				<Card className="flex-1">
					<CardHeader>
						<CardTitle>Your Uploads</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animations-grid">
							{templates.length > 0 ? (
								templates.map((template) => (
									<TemplateCard
										key={template.id}
										template={template}
										isSelected={selectedTemplate?.id === template.id}
										onSelect={setSelectedTemplate}
										createdAt={template.createdAt}
										isCustom={template.isCustom}
										userTier={user?.subscription.tier as "pro" | "free"}
									/>
								))
							) : (
								<EmptyState />
							)}
						</div>
					</CardContent>
				</Card>

				<div className="w-full lg:w-80 order-first lg:order-last animation-uploader">
					<CustomAnimationUploader />
				</div>
			</div>
		</div>
	);
}
