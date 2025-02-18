"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { Image } from "@heroui/react";
import { cn } from "@/lib/utils";

type AccordionItemProps = {
	children: React.ReactNode;
	className?: string;
} & Accordion.AccordionItemProps;

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
	({ children, className, ...props }, forwardedRef) => (
		<Accordion.Item
			className={cn(
				"mt-px overflow-hidden focus-within:relative focus-within:z-10",
				className
			)}
			{...props}
			ref={forwardedRef}
		>
			{children}
		</Accordion.Item>
	)
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps {
	children: React.ReactNode;
	className?: string;
}

const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
	({ children, className, ...props }, forwardedRef) => (
		<Accordion.Header className="flex">
			<Accordion.Trigger
				className={cn(
					"group flex flex-1 cursor-pointer items-center justify-between px-5 text-[15px] leading-none outline-none",
					className
				)}
				{...props}
				ref={forwardedRef}
			>
				{children}
			</Accordion.Trigger>
		</Accordion.Header>
	)
);
AccordionTrigger.displayName = "AccordionTrigger";
type AccordionContentProps = {
	children: ReactNode;
	className?: string;
} & Accordion.AccordionContentProps;

const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
	({ children, className, ...props }, forwardedRef) => (
		<Accordion.Content
			className={cn(
				"data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down overflow-hidden text-[15px] font-medium",
				className
			)}
			{...props}
			ref={forwardedRef}
		>
			<div className="px-5 py-2">{children}</div>
		</Accordion.Content>
	)
);
AccordionContent.displayName = "AccordionContent";

export interface FeaturesDataProps {
	id: number;
	title: string;
	content: string;
	image?: string;
	video?: string;
	icon?: React.ReactNode;
}

export interface FeaturesProps {
	collapseDelay?: number;
	ltr?: boolean;
	linePosition?: "left" | "right" | "top" | "bottom";
	data: FeaturesDataProps[];
}

const NumberIcon = ({ number }: { number: number }) => (
	<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
		{number}
	</div>
);

export const featuresData: FeaturesDataProps[] = [
	{
		id: 1,
		title: "Add Your First Recipient",
		content:
			"Start by adding your first recipient in the Recipients section. Enter their name, email, birthday, and any special dates you want to remember. You can also add notes about their preferences to make your greetings more personal.",
		icon: <NumberIcon number={1} />,
		image: "/features/placeholder-recipients.png",
	},
	{
		id: 2,
		title: "Upload Your First Animation",
		content:
			"Visit the Animations section to upload your first custom animation. We support GIFs, images, and various animation formats. You can preview how they'll look in your emails and organize them into categories for easy access.",
		icon: <NumberIcon number={2} />,
		image: "/features/placeholder-animations.png",
	},
	{
		id: 3,
		title: "Use the Email Builder",
		content:
			"Open the Email Builder to create your first greeting. Choose a template, add your custom animations, and personalize the message. You can preview how it will look on different devices and schedule it to be sent at the perfect moment.",
		icon: <NumberIcon number={3} />,
		image: "/features/placeholder-builder.png",
	},
	{
		id: 4,
		title: "View Your Unified Dashboard",
		content:
			"Access your personalized dashboard to see all upcoming events, scheduled emails, and recipient birthdays at a glance. The timeline view helps you plan ahead and ensure you never miss an important date.",
		icon: <NumberIcon number={4} />,
		image: "/features/placeholder-dashboard.png",
	},
	{
		id: 5,
		title: "Configure Your Settings",
		content:
			"Customize your experience in the Settings section. Set up email reminders for upcoming events, configure your preferred notification schedule, and manage your calendar integrations to stay perfectly organized.",
		icon: <NumberIcon number={5} />,
		image: "/features/placeholder-reminders.png",
	},
];

export function Features({
	collapseDelay = 6000,
	data = featuresData,
}: FeaturesProps) {
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const ref = useRef(null);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % data.length);
		}, collapseDelay);

		return () => clearInterval(timer);
	}, [collapseDelay, data.length]);

	return (
		<section ref={ref} id="features" className="w-full">
			<div className="container mx-auto px-4">
				<div className="mx-auto max-w-7xl">
					{/* Feature Steps */}
					<div className="mb-8 flex items-center justify-center space-x-[2rem] sm:space-x-[2rem]">
						{data.map((item, index) => (
							<button
								key={item.id}
								onClick={() => setCurrentIndex(index)}
								className="group relative"
							>
								<div
									className={cn(
										"flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all duration-300",
										index === currentIndex
											? "bg-primary text-primary-foreground"
											: "bg-primary/10 text-primary hover:bg-primary/20"
									)}
								>
									<span className="text-base sm:text-lg font-bold">
										{item.id}
									</span>
								</div>
								{index < data.length - 1 && (
									<div
										className="absolute left-full top-1/2 h-[2px] w-[2rem] -translate-y-1/2 bg-primary/30"
										style={{
											background: `linear-gradient(to right, rgba(var(--primary) / 0.3), rgba(var(--primary) / 0.3))`,
										}}
									/>
								)}
							</button>
						))}
					</div>

					{/* Active Feature Content */}
					<div className="mb-8 text-center px-4">
						<h3 className="mb-4 text-xl sm:text-2xl font-bold">
							{data[currentIndex].title}
						</h3>
						<p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground">
							{data[currentIndex].content}
						</p>
					</div>

					{/* Feature Image */}
					<div className="relative mx-auto h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] w-full max-w-5xl overflow-hidden rounded-xl">
						<motion.div
							key={currentIndex}
							className="h-full w-full"
							initial={{ opacity: 0, scale: 0.98 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.98 }}
							transition={{ duration: 0.25, ease: "easeOut" }}
						>
							<Image
								src={data[currentIndex].image}
								alt={`Feature: ${data[currentIndex].title}`}
								className="h-full w-full transition-all duration-300"
								radius="lg"
								classNames={{
									wrapper:
										"h-full w-full shadow-[0_20px_50px_-12px_rgba(var(--primary)_/_0.7)]",
									img: "object-cover object-center",
									zoomedWrapper: "h-full w-full",
								}}
								fallbackSrc="/placeholder-image.png"
								style={{
									objectFit: "cover",
								}}
							/>
						</motion.div>
					</div>
				</div>
			</div>
		</section>
	);
}
