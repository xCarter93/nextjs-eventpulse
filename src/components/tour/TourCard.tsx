"use client";

import React from "react";
import { Card, CardBody, CardFooter, Button } from "@heroui/react";
import { type CardComponentProps } from "nextstepjs";

export function TourCard({
	step,
	currentStep,
	totalSteps,
	nextStep,
	prevStep,
	skipTour,
	arrow,
}: CardComponentProps) {
	return (
		<Card className="w-[350px] p-4" shadow="md" radius="lg">
			<CardBody className="gap-4">
				<div className="flex items-center gap-2 mb-2">
					<div className="text-2xl">{step.icon}</div>
					<h3 className="text-lg font-semibold">{step.title}</h3>
				</div>
				<div className="text-sm text-gray-600 dark:text-gray-300">
					{step.content}
				</div>
				{arrow}
			</CardBody>
			<CardFooter className="flex justify-between items-center pt-4">
				<div className="flex items-center gap-2">
					{step.showSkip && (
						<Button
							variant="light"
							color="default"
							onPress={skipTour}
							size="sm"
						>
							Skip
						</Button>
					)}
					{currentStep > 0 && (
						<Button variant="flat" color="default" onPress={prevStep} size="sm">
							Previous
						</Button>
					)}
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-500">
						{currentStep + 1}/{totalSteps}
					</span>
					<Button color="primary" onPress={nextStep} size="sm">
						{currentStep === totalSteps - 1 ? "Finish" : "Next"}
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
