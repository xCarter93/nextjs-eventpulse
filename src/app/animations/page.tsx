"use client";

import { useState } from "react";
import { type AnimationTemplate } from "@/types";
import { TemplateCard } from "@/components/animations/TemplateCard";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Image, Upload, Sparkles, FileImage } from "lucide-react";
import { Pagination, Card, CardBody } from "@heroui/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWithStats } from "@/components/shared/PageWithStats";
import { CustomAnimationUploader } from "@/components/animations/CustomAnimationUploader";
import { AIImageGenerator } from "@/components/animations/AIImageGenerator";

function EmptyState() {
	return (
		<div className="col-span-full min-h-[400px] flex items-center justify-center">
			<div className="text-center space-y-6 max-w-md mx-auto p-6">
				<div className="relative">
					<div className="grid grid-cols-2 gap-4 mb-4">
						{[Image, Upload, Sparkles, FileImage].map((Icon, i) => (
							<div
								key={i}
								className="p-4 bg-muted/30 rounded-xl group hover:bg-primary/10 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
							>
								<Icon
									className="w-8 h-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300"
									strokeWidth={1.5}
								/>
							</div>
						))}
					</div>
					<div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
				</div>
				<div>
					<h3 className="text-lg font-semibold text-foreground mb-2">
						No animations yet
					</h3>
					<p className="text-sm text-muted-foreground">
						Click the &ldquo;Upload Animation&rdquo; quick action to upload your
						first animation. You can use GIFs, JPGs, or PNGs to create custom
						animations.
					</p>
				</div>
			</div>
		</div>
	);
}

export default function AnimationsPage() {
	const [selectedTemplate, setSelectedTemplate] =
		useState<AnimationTemplate | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [activeTab, setActiveTab] = useState("gallery");
	const itemsPerPage = 8;

	const userAnimations = useQuery(api.animations.getUserAnimations);
	const user = useQuery(api.users.getUser);

	const templates: AnimationTemplate[] =
		userAnimations
			?.map((animation) => ({
				id: animation._id,
				name: animation.name || "Untitled Animation",
				description: animation.description || "",
				previewUrl: animation.url,
				createdAt: animation._creationTime,
				isCustom: !animation.isBaseAnimation,
			}))
			?.sort((a, b) => b.createdAt - a.createdAt) || [];

	const totalPages = Math.ceil(templates.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentTemplates = templates.slice(startIndex, endIndex);

	const handleTabChange = (value: string) => {
		setActiveTab(value);
	};

	const handleAnimationAdded = () => {
		// Reset to gallery tab and first page
		setActiveTab("gallery");
		setCurrentPage(1);
	};

	return (
		<PageWithStats>
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold text-foreground">
						Custom Animations & Images
					</h1>
					<p className="mt-2 text-muted-foreground">
						Upload and manage your custom GIFs and images for email greetings
					</p>
				</div>

				<Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
					<div className="flex items-center justify-between">
						<TabsList className="bg-secondary/20">
							<TabsTrigger
								value="gallery"
								className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
							>
								My Gallery
							</TabsTrigger>
							<TabsTrigger
								value="upload"
								className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
							>
								Upload Animation
							</TabsTrigger>
							<TabsTrigger
								value="generate"
								className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
							>
								AI Generate
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="gallery" className="space-y-4">
						<Card className="flex-1" radius="lg" shadow="md" isBlurred={true}>
							<CardBody className="p-6">
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animations-grid">
									{currentTemplates.length > 0 ? (
										currentTemplates.map((template) => (
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
								{templates.length > itemsPerPage && (
									<div className="flex justify-center mt-6">
										<Pagination
											total={totalPages}
											page={currentPage}
											onChange={setCurrentPage}
											showControls
											size="md"
											radius="md"
											variant="bordered"
											classNames={{
												wrapper: "gap-2",
												item: "min-w-8 h-8",
											}}
										/>
									</div>
								)}
							</CardBody>
						</Card>
					</TabsContent>

					<TabsContent value="upload" className="space-y-4">
						<CustomAnimationUploader onSuccess={handleAnimationAdded} />
					</TabsContent>

					<TabsContent value="generate" className="space-y-4">
						<AIImageGenerator onSuccess={handleAnimationAdded} />
					</TabsContent>
				</Tabs>
			</div>
		</PageWithStats>
	);
}
