import { createTool } from "@mastra/core";
import { z } from "zod";

// Simple storage for tracking conversation state (in production, use proper state management)
const conversationStates = new Map<
	string,
	{
		step: "name" | "email" | "birthday" | "create";
		data: {
			name?: string;
			email?: string;
			birthday?: string;
		};
	}
>();

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

// Simple step-by-step contact creation tool that works with conversational AI
export const createContactStepByStepTool = createTool({
	id: "create-contact-step-by-step",
	description:
		"Create a contact through a step-by-step process. Call this tool multiple times - first to start, then with each piece of information as the user provides it.",
	inputSchema: z.object({
		action: z
			.enum([
				"start",
				"provide-name",
				"provide-email",
				"provide-birthday",
				"skip-birthday",
			])
			.describe("The action to take in the contact creation process"),
		value: z
			.string()
			.optional()
			.describe("The value being provided (name, email, or birthday)"),
		userId: z.string().describe("Unique identifier for this conversation/user"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		message: z.string(),
		nextStep: z.string().optional(),
		completed: z.boolean(),
		contactDetails: z
			.object({
				name: z.string(),
				email: z.string(),
				birthday: z.string().optional(),
			})
			.optional(),
	}),
	execute: async ({ context }) => {
		const { action, value, userId } = context;

		// Get or create conversation state
		const state = conversationStates.get(userId);

		switch (action) {
			case "start":
				// Initialize new contact creation process
				conversationStates.set(userId, {
					step: "name",
					data: {},
				});
				return {
					success: true,
					message: "Let's create a new contact! What is the contact's name?",
					nextStep: "Waiting for name",
					completed: false,
				};

			case "provide-name":
				if (!state || state.step !== "name") {
					return {
						success: false,
						message:
							"Please start the contact creation process first by calling this tool with action 'start'.",
						completed: false,
					};
				}

				if (!value?.trim()) {
					return {
						success: false,
						message: "Please provide a valid name for the contact.",
						nextStep: "Waiting for name",
						completed: false,
					};
				}

				// Save name and move to email step
				state.data.name = value.trim();
				state.step = "email";
				conversationStates.set(userId, state);

				return {
					success: true,
					message: `Great! The contact's name is **${value.trim()}**. Now, what is their email address?`,
					nextStep: "Waiting for email",
					completed: false,
				};

			case "provide-email":
				if (!state || state.step !== "email") {
					return {
						success: false,
						message: "Please provide the contact's name first.",
						completed: false,
					};
				}

				if (!value?.trim()) {
					return {
						success: false,
						message: "Please provide a valid email address for the contact.",
						nextStep: "Waiting for email",
						completed: false,
					};
				}

				// Basic email validation
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(value.trim())) {
					return {
						success: false,
						message:
							"Please provide a valid email address format (e.g., user@example.com).",
						nextStep: "Waiting for email",
						completed: false,
					};
				}

				// Save email and move to birthday step
				state.data.email = value.trim();
				state.step = "birthday";
				conversationStates.set(userId, state);

				return {
					success: true,
					message: `Perfect! Email address: **${value.trim()}**. Finally, what is their birthday? (You can enter MM/DD/YYYY format, natural language like "April 20, 1985", or say "skip" to skip this field)`,
					nextStep: "Waiting for birthday or skip",
					completed: false,
				};

			case "provide-birthday":
				if (!state || state.step !== "birthday") {
					return {
						success: false,
						message: "Please provide the contact's name and email first.",
						completed: false,
					};
				}

				if (!value?.trim()) {
					return {
						success: false,
						message:
							"Please provide a birthday or say 'skip' to skip this field.",
						nextStep: "Waiting for birthday or skip",
						completed: false,
					};
				}

				// Save birthday and create contact
				state.data.birthday = value.trim();
				state.step = "create";
				conversationStates.set(userId, state);

				// Create the contact
				try {
					// Import needed modules
					const { ConvexHttpClient } = await import("convex/browser");
					const { createRecipient } = await import(
						"../../utils/server-actions"
					);

					const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
					if (!convexUrl) {
						throw new Error("Convex configuration error");
					}

					const convex = new ConvexHttpClient(convexUrl);

					// Parse birthday
					let birthdayTimestamp: number | undefined;
					try {
						const parsedDate = new Date(state.data.birthday!);
						if (!isNaN(parsedDate.getTime())) {
							birthdayTimestamp = parsedDate.getTime();
						}
					} catch {
						// If parsing fails, continue without birthday
					}

					const result = await createRecipient(convex, {
						name: state.data.name!,
						email: state.data.email!,
						birthday: birthdayTimestamp || 0,
					});

					// Clean up conversation state
					conversationStates.delete(userId);

					if (result.success) {
						const birthdayText = state.data.birthday
							? ` with birthday on ${state.data.birthday}`
							: "";
						return {
							success: true,
							message: `🎉 **Contact Created Successfully!**\n\n✅ **${state.data.name}** (${state.data.email})${birthdayText}\n\nThey've been added to your contacts and are ready to receive your event notifications!`,
							completed: true,
							contactDetails: {
								name: state.data.name!,
								email: state.data.email!,
								birthday: state.data.birthday,
							},
						};
					} else {
						throw new Error(result.error || "Failed to create contact");
					}
				} catch (error) {
					// Clean up conversation state
					conversationStates.delete(userId);

					return {
						success: false,
						message: `❌ Failed to create contact: ${error instanceof Error ? error.message : "Unknown error"}`,
						completed: true,
						contactDetails: {
							name: state.data.name!,
							email: state.data.email!,
							birthday: state.data.birthday,
						},
					};
				}

			case "skip-birthday":
				if (!state || state.step !== "birthday") {
					return {
						success: false,
						message: "Please provide the contact's name and email first.",
						completed: false,
					};
				}

				// Create contact without birthday
				state.step = "create";
				conversationStates.set(userId, state);

				try {
					// Import needed modules
					const { ConvexHttpClient } = await import("convex/browser");
					const { createRecipient } = await import(
						"../../utils/server-actions"
					);

					const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
					if (!convexUrl) {
						throw new Error("Convex configuration error");
					}

					const convex = new ConvexHttpClient(convexUrl);

					const result = await createRecipient(convex, {
						name: state.data.name!,
						email: state.data.email!,
						birthday: 0, // No birthday
					});

					// Clean up conversation state
					conversationStates.delete(userId);

					if (result.success) {
						return {
							success: true,
							message: `🎉 **Contact Created Successfully!**\n\n✅ **${state.data.name}** (${state.data.email})\n\nThey've been added to your contacts and are ready to receive your event notifications!`,
							completed: true,
							contactDetails: {
								name: state.data.name!,
								email: state.data.email!,
							},
						};
					} else {
						throw new Error(result.error || "Failed to create contact");
					}
				} catch (error) {
					// Clean up conversation state
					conversationStates.delete(userId);

					return {
						success: false,
						message: `❌ Failed to create contact: ${error instanceof Error ? error.message : "Unknown error"}`,
						completed: true,
						contactDetails: {
							name: state.data.name!,
							email: state.data.email!,
						},
					};
				}

			default:
				return {
					success: false,
					message:
						"Invalid action. Use 'start', 'provide-name', 'provide-email', 'provide-birthday', or 'skip-birthday'.",
					completed: false,
				};
		}
	},
});
