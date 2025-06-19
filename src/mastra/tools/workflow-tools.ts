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

// Tool that starts the interactive contact creation workflow
export const runContactCreationWorkflowTool = createTool({
	id: "run-contact-creation-workflow",
	description:
		"Start the interactive step-by-step contact creation workflow. This workflow will ask for the contact's name, email, and birthday one at a time. Use this when you want to create a new contact interactively.",
	inputSchema: z.object({
		start: z
			.boolean()
			.default(true)
			.describe("Start the contact creation process"),
	}),
	outputSchema: z.object({
		message: z.string(),
		status: z.string(),
		runId: z.string().optional(),
		suspended: z.array(z.string()).optional(),
	}),
	execute: async ({ mastra }) => {
		const workflow = mastra?.getWorkflow("contactCreationWorkflow");
		if (!workflow) {
			throw new Error("Contact creation workflow not found");
		}

		const run = workflow.createRun();

		try {
			await run.start({
				inputData: {
					start: true,
				},
			});

			// Handle suspended state (interactive workflow asking for input)
			return {
				message: "What is the contact's name?",
				status: "suspended",
				runId: run.runId,
				suspended: ["ask-for-name"],
			};
		} catch (error) {
			throw new Error(
				`Workflow failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	},
});
