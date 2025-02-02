"use client";

import { Breadcrumbs as HeroBreadcrumbs, BreadcrumbItem } from "@heroui/react";
import { steps } from "@/app/scheduled-emails/new/steps";
import React from "react";

interface BreadcrumbsProps {
	currentStep: string;
	setCurrentStep: (step: string) => void;
}

type Step = {
	title: string;
	key: string;
};

export default function BreadcrumbsNav({
	currentStep,
	setCurrentStep,
}: BreadcrumbsProps) {
	const handleAction = (key: React.Key) => {
		setCurrentStep(key.toString());
	};

	return (
		<div className="flex justify-center w-full px-2">
			<HeroBreadcrumbs
				variant="solid"
				radius="full"
				onAction={handleAction}
				classNames={{
					base: "gap-1 rounded-full shadow-[0_2px_10px] shadow-black/10 dark:shadow-primary/20",
					list: "gap-1",
					separator: "mx-0.5 sm:mx-1",
				}}
				itemClasses={{
					base: "data-[current=true]:bg-secondary data-[current=true]:text-secondary-foreground cursor-pointer",
					item: "px-2 py-0.5 text-sm",
				}}
			>
				{steps.map((step: Step) => (
					<BreadcrumbItem key={step.key} isCurrent={step.key === currentStep}>
						{step.title}
					</BreadcrumbItem>
				))}
			</HeroBreadcrumbs>
		</div>
	);
}
