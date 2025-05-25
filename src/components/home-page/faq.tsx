import React from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { motion } from "framer-motion";

export const FAQ = () => {
	const faqs = [
		{
			question: "What features are available in the Dashboard?",
			answer:
				"The Dashboard provides real-time analytics and event performance metrics, quick access to upcoming events and recent activities, user engagement statistics, and email campaign performance tracking. It includes a calendar view with monthly, weekly, and daily views, along with event status indicators and priority flags.",
		},
		{
			question: "How does the Recipients Management work?",
			answer:
				"The Recipients Management feature allows you to organize and segment contact lists, import/export recipient data, track engagement and interaction history, manage recipient preferences and settings, group contacts by categories or relationships, perform bulk actions for multiple recipients, and use powerful search and filter capabilities.",
		},
		{
			question: "What can I do with the Email Campaign Tools?",
			answer:
				"With Email Campaign Tools, you can schedule automated email communications, create and manage email templates, track delivery and open rates, set up event reminders and follow-ups, conduct A/B testing for email content, use personalization tokens for dynamic content, and access various scheduling options like immediate, delayed, or recurring emails.",
		},
		{
			question: "What is the Animation Studio for?",
			answer:
				"The Animation Studio enables you to create custom animations for email content, design engaging visual elements, preview and test animations, export animations for email campaigns, access a library of pre-built animation templates, customize colors, timing, and effects, and ensure mobile-responsive animation designs.",
		},
		{
			question: "What settings and configurations are available?",
			answer:
				"The Settings & Configuration section allows you to manage account preferences, integration settings, email delivery configurations, user access management, notification preferences, API access and webhook configuration, and data retention and privacy settings.",
		},
		{
			question: "How can I use the AI Assistant?",
			answer:
				"The AI Assistant is accessible via a floating chat button in the bottom right corner of any page. It can help with EventPulse features, answer questions about platform functionality, guide you through common workflows, offer troubleshooting assistance, create new recipients, create new events, search for contacts, and find upcoming events.",
		},
	];

	return (
		<section id="faq" className="py-20 md:py-28 bg-background">
			<div className="container mx-auto px-4">
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
						Frequently Asked Questions
					</h2>
					<p className="text-lg text-muted-foreground">
						Find answers to common questions about EventPulse features and
						functionality.
					</p>
				</div>

				<motion.div
					className="max-w-3xl mx-auto"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				>
					<Accordion variant="splitted" selectionMode="multiple">
						{faqs.map((faq, index) => (
							<AccordionItem
								key={index}
								aria-label={faq.question}
								title={faq.question}
								classNames={{
									title: "text-lg font-medium",
									trigger: "px-4 py-3 data-[hover=true]:bg-primary/5",
								}}
							>
								<div className="px-4 pb-4 text-muted-foreground">
									<p>{faq.answer}</p>
								</div>
							</AccordionItem>
						))}
					</Accordion>
				</motion.div>
			</div>
		</section>
	);
};
