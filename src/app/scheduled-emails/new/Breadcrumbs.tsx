import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

export default function Breadcrumbs({
	currentStep,
	setCurrentStep,
}: BreadcrumbsProps) {
	return (
		<div className="flex justify-center">
			<Breadcrumb>
				<BreadcrumbList>
					{steps.map((step: Step) => (
						<React.Fragment key={step.key}>
							<BreadcrumbItem>
								{step.key === currentStep ? (
									<BreadcrumbPage>{step.title}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<button onClick={() => setCurrentStep(step.key)}>
											{step.title}
										</button>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							<BreadcrumbSeparator className="last:hidden" />
						</React.Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>
		</div>
	);
}
