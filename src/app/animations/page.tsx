"use client";

import { useState } from "react";
import { type AnimationTemplate, type ColorScheme } from "@/types";
import { TemplateCard } from "@/components/animations/TemplateCard";
import { ColorSchemeSelector } from "@/components/animations/ColorSchemeSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { type ChangeEvent } from "react";
import Animation from "@/components/animations/LottieAnimation";
import { CustomAnimationUploader } from "@/components/animations/CustomAnimationUploader";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const defaultColorScheme: ColorScheme = {
	primary: "#3B82F6",
	secondary: "#60A5FA",
	accent: "#F59E0B",
	background: "#F3F4F6",
};

type LottieAnimationProps = React.ComponentProps<typeof Animation>;

export default function AnimationsPage() {
	const [selectedTemplate, setSelectedTemplate] =
		useState<AnimationTemplate | null>(null);
	const [colorScheme, setColorScheme] =
		useState<ColorScheme>(defaultColorScheme);
	const [message, setMessage] = useState("");

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

	const handleCreate = () => {
		// This would send the data to your API to create the animation
		console.log({
			templateId: selectedTemplate?.id,
			colorScheme,
			message,
		});
	};

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

				{selectedTemplate && (
					<>
						<Card>
							<CardHeader>
								<CardTitle>Customize Colors</CardTitle>
							</CardHeader>
							<CardContent>
								<ColorSchemeSelector
									value={colorScheme}
									onChange={setColorScheme}
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Greeting Message</CardTitle>
							</CardHeader>
							<CardContent>
								<Textarea
									value={message}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setMessage(e.target.value)
									}
									placeholder="Enter your greeting message..."
									className="h-32"
								/>
							</CardContent>
						</Card>

						<Separator />

						<div className="flex justify-end">
							<Button
								onClick={handleCreate}
								disabled={!message.trim()}
								size="lg"
							>
								Create Animation
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
