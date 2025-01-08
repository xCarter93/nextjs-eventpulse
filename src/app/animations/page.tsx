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
import LottieAnimation from "@/components/animations/LottieAnimation";
import { CustomAnimationUploader } from "@/components/animations/CustomAnimationUploader";

// Mock data - would come from your API/database
const templates: AnimationTemplate[] = [
	{
		id: "1",
		name: "Floating Animation",
		description: "A beautiful animated celebration message",
		previewComponent: LottieAnimation,
		isPremium: false,
	},
	{
		id: "2",
		name: "Confetti Explosion",
		description: "A burst of confetti with customizable colors",
		previewComponent: (props) => (
			<LottieAnimation
				{...props}
				src="/lottiefiles/Confetti - 1736126738780.lottie"
			/>
		),
		isPremium: false,
	},
	{
		id: "3",
		name: "Sparkle Animation",
		description: "A magical sparkle effect for your birthday message",
		previewComponent: (props) => (
			<LottieAnimation
				{...props}
				src="/lottiefiles/Sparkle - 1736127010347.lottie"
			/>
		),
		isPremium: false,
	},
	{
		id: "4",
		name: "Blooming Rose",
		description: "A beautiful animated rose that blooms with your message",
		previewComponent: (props) => (
			<LottieAnimation
				{...props}
				src="/lottiefiles/Rose - 1736126013373.lottie"
			/>
		),
		isPremium: false,
	},
	{
		id: "custom",
		name: "Custom Animation",
		description: (
			<div className="space-y-1">
				<span>Upload your own Lottie animation file</span>
				<span className="block text-xs">
					Find free animations at{" "}
					<a
						href="https://lottiefiles.com/featured-free-animations"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
						onClick={(e) => e.stopPropagation()}
					>
						LottieFiles
					</a>
				</span>
			</div>
		),
		previewComponent: CustomAnimationUploader,
		isPremium: false,
	},
];

const defaultColorScheme: ColorScheme = {
	primary: "#3B82F6",
	secondary: "#60A5FA",
	accent: "#F59E0B",
	background: "#F3F4F6",
};

export default function AnimationsPage() {
	const [selectedTemplate, setSelectedTemplate] =
		useState<AnimationTemplate | null>(null);
	const [colorScheme, setColorScheme] =
		useState<ColorScheme>(defaultColorScheme);
	const [message, setMessage] = useState("");

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
					Choose a template and customize your birthday animation
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
								/>
							))}
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
								<CardTitle>Birthday Message</CardTitle>
							</CardHeader>
							<CardContent>
								<Textarea
									value={message}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setMessage(e.target.value)
									}
									placeholder="Enter your birthday message..."
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
