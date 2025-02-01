"use client";

import { useCallback } from "react";
import { NextStepProvider, useNextStep, NextStep, type Tour } from "nextstepjs";
import { useRouter } from "next/navigation";
import { TourCard } from "@/components/tour/TourCard";

const steps: Tour[] = [
	{
		tour: "onboarding",
		steps: [
			{
				icon: <>👋</>,
				title: "Welcome to EventPulse!",
				content:
					"Let's take a quick tour of the main features to help you get started with managing your email campaigns and events.",
				side: "top" as const,
				showControls: true,
				showSkip: true,
				pointerPadding: 0,
				pointerRadius: 0,
			},
			{
				icon: <>📊</>,
				title: "User Statistics",
				content: "View your email sending statistics and account usage",
				selector: ".user-stats",
				side: "top" as const,
				showControls: true,
				showSkip: true,
				pointerPadding: 15,
				pointerRadius: 15,
			},
			{
				icon: <>📅</>,
				title: "Upcoming Events",
				content: "See all your scheduled emails and upcoming recipient events",
				selector: ".upcoming-events",
				side: "top" as const,
				showControls: true,
				showSkip: true,
				pointerPadding: 15,
				pointerRadius: 15,
			},
			{
				icon: <>⚡</>,
				title: "Quick Actions",
				content:
					"Quickly create new emails, add recipients, or upload animations",
				selector: ".quick-actions",
				side: "top" as const,
				showControls: true,
				showSkip: true,
				pointerPadding: 15,
				pointerRadius: 15,
			},
			{
				icon: <>📆</>,
				title: "Event Calendar",
				content:
					"View all your scheduled emails and recipient events in calendar format",
				selector: ".calendar",
				side: "right" as const,
				showControls: true,
				showSkip: true,
				pointerPadding: 15,
				pointerRadius: 15,
				nextRoute: "/animations",
			},
			{
				icon: <>🎨</>,
				title: "Custom Animations Gallery",
				content:
					"This is where all your custom animations will be displayed. You can preview, select, and manage them here.",
				selector: ".animations-grid",
				side: "top" as const,
				showControls: true,
				showSkip: true,
				pointerPadding: 15,
				pointerRadius: 15,
			},
			{
				icon: <>⬆️</>,
				title: "Upload Animations",
				content:
					"Use this uploader to add your own custom GIFs, JPGs, or PNGs. They'll appear in the gallery once uploaded.",
				selector: ".animation-uploader",
				side: "left" as const,
				showControls: true,
				showSkip: true,
				pointerPadding: 15,
				pointerRadius: 15,
				nextRoute: "/recipients",
				prevRoute: "/dashboard",
			},
			{
				icon: <>👥</>,
				title: "Manage Recipients",
				content: "Add and manage recipients for your personalized emails",
				selector: ".recipients-table",
				side: "top" as const,
				showControls: true,
				showSkip: true,
				pointerPadding: 15,
				pointerRadius: 15,
				nextRoute: "/scheduled-emails",
				prevRoute: "/animations",
			},
			{
				icon: <>📧</>,
				title: "Email Status",
				content:
					"Track your emails across different states: pending, completed, and cancelled",
				selector: ".email-status-tabs",
				side: "top" as const,
				showControls: true,
				showSkip: true,
				pointerPadding: 15,
				pointerRadius: 15,
				prevRoute: "/recipients",
			},
			{
				icon: <>✨</>,
				title: "Create New Email",
				content:
					"Start creating a new personalized email with your custom animations",
				selector: ".create-email-button",
				side: "top" as const,
				showControls: true,
				showSkip: false,
				pointerPadding: 15,
				pointerRadius: 15,
			},
		],
	},
];

export function TourProvider({ children }: { children: React.ReactNode }) {
	return (
		<NextStepProvider>
			<NextStep steps={steps} cardComponent={TourCard} shadowOpacity="0.85">
				{children}
			</NextStep>
		</NextStepProvider>
	);
}

export const useTour = () => {
	const {
		startNextStep,
		closeNextStep,
		currentTour,
		currentStep,
		setCurrentStep,
		isNextStepVisible,
	} = useNextStep();
	const router = useRouter();

	const startTour = useCallback(() => {
		router.push("/dashboard");
		startNextStep("onboarding");
	}, [router, startNextStep]);

	return {
		startTour,
		endTour: closeNextStep,
		currentStep,
		setCurrentStep,
		isVisible: isNextStepVisible,
		currentTour,
	};
};
