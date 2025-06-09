"use client";

import { useState } from "react";
import { type AnimationTemplate } from "@/types";
import { TemplateCard } from "@/components/animations/TemplateCard";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
	Image,
	Upload,
	Sparkles,
	FileImage,
	Palette,
	Wand2,
	Camera,
} from "lucide-react";
import { Pagination, Card, CardBody, Chip, Divider } from "@heroui/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWithStats } from "@/components/shared/PageWithStats";
import { CustomAnimationUploader } from "@/components/animations/CustomAnimationUploader";
import { AIImageGenerator } from "@/components/animations/AIImageGenerator";

function EmptyState() {
	const icons = [Image, Upload, Sparkles, FileImage, Palette, Wand2, Camera];
	const animationIcons = icons.slice(0, 3); // Use first 3 for main display

	return (
		<div className="col-span-full relative overflow-hidden">
			{/* Background gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-50 blur-3xl" />

			<Card
				radius="lg"
				shadow="lg"
				isBlurred={true}
				className="relative border border-border/50 bg-background/80 backdrop-blur-xl backdrop-saturate-150 hover:shadow-2xl hover:border-border/70 transition-all duration-500 ease-out hover:scale-[1.01]"
			>
				<CardBody className="p-8">
					<div className="min-h-[420px] flex items-center justify-center">
						<div className="text-center space-y-8 max-w-lg mx-auto">
							{/* Status chip */}
							<div className="flex justify-center">
								<Chip
									color="primary"
									variant="flat"
									size="sm"
									className="text-xs font-medium"
								>
									Ready to create
								</Chip>
							</div>

							{/* Animated icons grid */}
							<div className="relative">
								<div className="grid grid-cols-3 gap-6 mb-6">
									{animationIcons.map((Icon, i) => (
										<div
											key={i}
											className="group cursor-default"
											style={{
												animation: `float 3s ease-in-out infinite ${i * 0.5}s`,
											}}
										>
											<div className="p-6 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl group-hover:from-primary/20 group-hover:to-primary/10 hover:shadow-xl hover:-translate-y-2 hover:rotate-3 transition-all duration-500 ease-out border border-border/30 group-hover:border-primary/40">
												<Icon
													className="w-10 h-10 text-muted-foreground group-hover:text-primary group-hover:scale-125 transition-all duration-500 ease-out"
													strokeWidth={1.5}
												/>
											</div>
										</div>
									))}
								</div>

								{/* Subtle radial gradient overlay */}
								<div className="absolute inset-0 bg-gradient-radial from-transparent via-background/20 to-background/60 pointer-events-none" />
							</div>

							<Divider className="opacity-30" />

							{/* Content */}
							<div className="space-y-4">
								<h3 className="text-2xl font-bold text-foreground tracking-tight">
									No animations yet
								</h3>
								<p className="text-muted-foreground leading-relaxed text-base max-w-md mx-auto">
									Ready to bring your emails to life? Upload your first
									animation or generate one with AI. GIFs, JPGs, and PNGs are
									all welcome here.
								</p>
							</div>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Add floating animation keyframes */}
			<style jsx>{`
				@keyframes float {
					0%,
					100% {
						transform: translateY(0px);
					}
					50% {
						transform: translateY(-10px);
					}
				}
			`}</style>
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

				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
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
