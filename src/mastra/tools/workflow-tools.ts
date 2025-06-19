import { createTool } from "@mastra/core";
import { z } from "zod";

// Tool that runs the event creation workflow
export const runEventCreationWorkflowTool = createTool({
	id: "run-event-creation-workflow",
	description:
		"Execute the multi-step event creation workflow with validation and error handling",
	inputSchema: z.object({
		name: z.string().min(1, "Event name is required"),
		date: z.string().describe("Event date in any format"),
		isRecurring: z.boolean().default(false),
		additionalInfo: z
			.string()
			.optional()
			.describe("Additional context about the event"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		eventId: z.string().optional(),
		message: z.string(),
		eventDetails: z.object({
			name: z.string(),
			date: z.string(),
			isRecurring: z.boolean(),
		}),
	}),
	execute: async ({ context, mastra }) => {
		const { name, date, isRecurring, additionalInfo } = context;

		const workflow = mastra?.getWorkflow("eventCreationWorkflow");
		if (!workflow) {
			throw new Error("Event creation workflow not found");
		}

		const run = workflow.createRun();

		const result = await run.start({
			inputData: {
				name,
				date,
				isRecurring: isRecurring || false,
				additionalInfo,
			},
		});

		if (result.status === "success") {
			return result.result;
		} else if (result.status === "failed") {
			throw new Error(`Workflow failed: ${result.error || "Unknown error"}`);
		} else {
			throw new Error(`Workflow in unexpected state: ${result.status}`);
		}
	},
});

// Tool that runs the contact creation workflow
export const runContactCreationWorkflowTool = createTool({
	id: "run-contact-creation-workflow",
	description:
		"Execute the multi-step contact creation workflow with validation and error handling",
	inputSchema: z.object({
		name: z.string().min(1, "Name is required"),
		email: z.string().email("Please provide a valid email address"),
		birthday: z
			.string()
			.optional()
			.describe("Birthday in any format (optional)"),
		additionalInfo: z
			.string()
			.optional()
			.describe("Additional context about the contact"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		recipientId: z.string().optional(),
		message: z.string(),
		contactDetails: z.object({
			name: z.string(),
			email: z.string(),
			birthday: z.string().optional(),
		}),
	}),
	execute: async ({ context, mastra }) => {
		const { name, email, birthday, additionalInfo } = context;

		const workflow = mastra?.getWorkflow("contactCreationWorkflow");
		if (!workflow) {
			throw new Error("Contact creation workflow not found");
		}

		const run = workflow.createRun();

		const result = await run.start({
			inputData: {
				name,
				email,
				birthday,
				additionalInfo,
			},
		});

		if (result.status === "success") {
			return result.result;
		} else if (result.status === "failed") {
			throw new Error(`Workflow failed: ${result.error || "Unknown error"}`);
		} else {
			throw new Error(`Workflow in unexpected state: ${result.status}`);
		}
	},
});
