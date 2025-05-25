"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Image, Card, CardBody, Tabs, Tab } from "@heroui/react";
import { cn } from "@/lib/utils";
import {
	CheckIcon,
	UsersIcon,
	CalendarIcon,
	BellIcon,
	MailIcon,
	SettingsIcon,
} from "lucide-react";

export interface FeaturesDataProps {
	id: number;
	title: string;
	content: string;
	image?: string;
	icon?: React.ReactNode;
	key?: string;
	features?: string[];
}

export interface FeaturesProps {
	collapseDelay?: number;
	data?: FeaturesDataProps[];
}

export const featuresData: FeaturesDataProps[] = [
	{
		id: 1,
		key: "recipients",
		title: "Contact Management",
		content:
			"The Recipients Management feature allows you to organize and segment contact lists, import/export recipient data, and track engagement and interaction history. You can manage recipient preferences and settings, group contacts by categories or relationships, perform bulk actions for multiple recipients, and use powerful search and filter capabilities.",
		icon: <UsersIcon className="h-5 w-5" />,
		image: "/features/recipients.webp",
		features: [
			"Organize and segment contact lists",
			"Import/export recipient data",
			"Track engagement and interaction history",
			"Group contacts by categories or relationships",
		],
	},
	{
		id: 2,
		key: "animations",
		title: "Animation Studio",
		content:
			"The Animation Studio enables you to create custom animations for email content, design engaging visual elements, and export animations for email campaigns. It includes a library of pre-built animation templates with customization options for colors, timing, and effects, ensuring mobile-responsive animation designs.",
		icon: <BellIcon className="h-5 w-5" />,
		image: "/features/animations.webp",
		features: [
			"Create custom animations for email content",
			"Design engaging visual elements",
			"Preview and test animations",
			"Library of pre-built animation templates",
		],
	},
	{
		id: 3,
		key: "builder",
		title: "Email Campaign Tools",
		content:
			"Our Email Campaign Tools help you schedule automated email communications, create and manage email templates, and track delivery and open rates. You can set up event reminders and follow-ups, conduct A/B testing for email content, use personalization tokens for dynamic content, and access various scheduling options.",
		icon: <MailIcon className="h-5 w-5" />,
		image: "/features/email-builder.webp",
		features: [
			"Schedule automated email communications",
			"Create and manage email templates",
			"Set up event reminders and follow-ups",
			"A/B testing for email content",
		],
	},
	{
		id: 4,
		key: "dashboard",
		title: "Dashboard Features",
		content:
			"The Dashboard provides real-time analytics and event performance metrics, quick access to upcoming events and recent activities, user engagement statistics, and email campaign performance tracking. It includes a calendar view with monthly, weekly, and daily views, along with event status indicators and priority flags.",
		icon: <CalendarIcon className="h-5 w-5" />,
		image: "/features/dashboard.webp",
		features: [
			"Real-time analytics and event performance metrics",
			"Quick access to upcoming events and activities",
			"User engagement statistics",
			"Calendar view with monthly, weekly, and daily views",
		],
	},
	{
		id: 5,
		key: "settings",
		title: "Settings & Configuration",
		content:
			"The Settings & Configuration section allows you to manage account preferences, integration settings, email delivery configurations, and user access management. You can customize notification preferences, configure API access and webhook configuration, and adjust data retention and privacy settings.",
		icon: <SettingsIcon className="h-5 w-5" />,
		image: "/features/settings.webp",
		features: [
			"Account preferences and integration settings",
			"Email delivery configurations",
			"User access management",
			"API access and webhook configuration",
		],
	},
];

export function Features({
	collapseDelay = 6000,
	data = featuresData,
}: FeaturesProps) {
	const [selectedKey, setSelectedKey] = useState<string>(
		data[0].key || "recipients"
	);

	// Auto-rotate through tabs
	useEffect(() => {
		const timer = setInterval(() => {
			const currentIndex = data.findIndex((item) => item.key === selectedKey);
			const nextIndex = (currentIndex + 1) % data.length;
			setSelectedKey(data[nextIndex].key || "recipients");
		}, collapseDelay);

		return () => clearInterval(timer);
	}, [collapseDelay, data, selectedKey]);

	// Get current feature
	const currentFeature =
		data.find((item) => item.key === selectedKey) || data[0];

	// Animation variants
	const fadeIn = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
		},
	};

	return (
		<section id="features" className="py-20 md:py-28 bg-background">
			<div className="container mx-auto px-4">
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
						Everything You Need for Perfect Personalized Greetings
					</h2>
					<p className="text-lg text-muted-foreground">
						EventPulse provides powerful tools to streamline your event planning
						process from start to finish.
					</p>
				</div>

				{/* Left-aligned tabs */}
				<div className="max-w-5xl mx-auto">
					<div className="mb-12">
						<Tabs
							aria-label="EventPulse Features"
							selectedKey={selectedKey}
							onSelectionChange={(key: React.Key) =>
								setSelectedKey(String(key))
							}
							color="primary"
							variant="underlined"
							classNames={{
								tabList: "justify-start gap-4",
								cursor: "w-full",
								tab: "max-w-fit px-2 h-12",
							}}
						>
							{data.map((item) => (
								<Tab
									key={item.key}
									title={
										<div className="flex items-center gap-2">
											{item.icon}
											<span className="font-medium hidden md:hidden lg:block">
												{item.key === "recipients" && "Contacts"}
												{item.key === "animations" && "Animations"}
												{item.key === "builder" && "Emails"}
												{item.key === "dashboard" && "Dashboard"}
												{item.key === "settings" && "Settings"}
											</span>
										</div>
									}
								/>
							))}
						</Tabs>
					</div>

					{/* Feature content */}
					<motion.div
						key={selectedKey}
						initial="hidden"
						animate="visible"
						variants={fadeIn}
						className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
					>
						<div>
							<h3 className="text-2xl font-bold mb-3">
								{currentFeature.title}
							</h3>
							<p className="text-muted-foreground mb-6">
								{currentFeature.content}
							</p>

							{currentFeature.features && (
								<ul className="space-y-3">
									{currentFeature.features.map((feature, index) => (
										<li key={index} className="flex items-start gap-3">
											<div className="rounded-full bg-primary/10 p-1 mt-1">
												<CheckIcon className="h-3.5 w-3.5 text-primary" />
											</div>
											<span className="text-foreground">{feature}</span>
										</li>
									))}
								</ul>
							)}
						</div>

						<Card className="shadow-xl border border-divider overflow-hidden">
							<CardBody className="p-0">
								<div className="w-full max-h-[500px] flex items-center justify-center bg-muted/20">
									<Image
										src={currentFeature.image}
										alt={currentFeature.title}
										className="w-full max-h-[500px] transition-all duration-300"
										radius="lg"
										classNames={{
											wrapper:
												"w-full h-auto shadow-[0_10px_40px_-12px_rgba(var(--primary)_/_0.5)]",
											img: "object-contain object-center w-full h-auto",
										}}
										fallbackSrc="/EventPulse Logo-Photoroom.png"
										style={{ objectFit: "contain" }}
									/>
								</div>
							</CardBody>
						</Card>
					</motion.div>

					{/* Feature cards below */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
						{data.map((feature, index) => (
							<Card
								key={index}
								className={cn(
									"h-full border border-divider cursor-pointer hover:border-primary/50 transition-all",
									selectedKey === feature.key ? "border-primary shadow-md" : ""
								)}
								onClick={() => setSelectedKey(feature.key || "")}
							>
								<CardBody className="p-6">
									<div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-5">
										{feature.icon}
									</div>
									<h3 className="text-xl font-semibold mb-3">
										{feature.title}
									</h3>
									<p className="text-muted-foreground text-sm line-clamp-3">
										{feature.content.split(".")[0]}.
									</p>
								</CardBody>
							</Card>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
