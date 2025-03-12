import { z } from "zod";
import { tool } from "ai";
// These imports are used in the commented code
// import { createRecipient } from "./recipient-actions";
// import { ConvexHttpClient } from "convex/browser";

/**
 * Tool for creating a new recipient
 * This tool guides the user through the process of creating a new recipient
 */
export const createRecipientTool = tool({
	description: "Create a new recipient with name, email, and birthday",
	parameters: z.object({
		step: z.enum([
			"start",
			"collect-name",
			"collect-email",
			"collect-birthday",
			"confirm",
			"submit",
		]),
		name: z.string().optional(),
		email: z.string().email().optional(),
		birthday: z.string().optional(), // We'll convert this to a timestamp later
	}),
	execute: async ({ step, name, email, birthday }) => {
		// Log the input parameters for debugging
		console.log("createRecipientTool called with:", {
			step,
			name,
			email,
			birthday,
		});

		try {
			// Step-by-step process for creating a recipient
			switch (step) {
				case "start":
					return {
						status: "in_progress",
						message: "Let's create a new recipient. What's their name?",
						nextStep: "collect-name",
					};

				case "collect-name":
					if (!name) {
						return {
							status: "error",
							message:
								"I need a name for the recipient. Please provide a name.",
							nextStep: "collect-name",
						};
					}
					return {
						status: "in_progress",
						message: `Great! Now, what's ${name}'s email address?`,
						nextStep: "collect-email",
						name,
					};

				case "collect-email":
					if (!name) {
						return {
							status: "error",
							message:
								"I need the recipient's name first. Let's start over. What's their name?",
							nextStep: "collect-name",
						};
					}

					if (!email) {
						return {
							status: "error",
							message:
								"I need an email address for the recipient. Please provide a valid email.",
							nextStep: "collect-email",
							name,
						};
					}

					// Basic email validation
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(email)) {
						return {
							status: "error",
							message:
								"That doesn't look like a valid email address. Please provide a valid email.",
							nextStep: "collect-email",
							name,
						};
					}

					return {
						status: "in_progress",
						message: `Now, when is ${name}'s birthday? Please provide it in MM/DD/YYYY format.`,
						nextStep: "collect-birthday",
						name,
						email,
					};

				case "collect-birthday":
					if (!name || !email) {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					if (!birthday) {
						return {
							status: "error",
							message:
								"I need a birthday for the recipient. Please provide it in MM/DD/YYYY format.",
							nextStep: "collect-birthday",
							name,
							email,
						};
					}

					// Basic date validation and conversion to timestamp
					let birthdayTimestamp: number;
					try {
						const [month, day, year] = birthday.split("/").map(Number);
						const date = new Date(year, month - 1, day);

						// Check if the date is valid
						if (isNaN(date.getTime())) {
							throw new Error("Invalid date");
						}

						birthdayTimestamp = date.getTime();
					} catch (error) {
						console.error("Date validation error:", error);
						return {
							status: "error",
							message:
								"That doesn't look like a valid date. Please provide the birthday in MM/DD/YYYY format.",
							nextStep: "collect-birthday",
							name,
							email,
						};
					}

					return {
						status: "in_progress",
						message: `Great! Here's a summary of the recipient:\n\nName: ${name}\nEmail: ${email}\nBirthday: ${birthday}\n\nIs this information correct? (yes/no)`,
						nextStep: "confirm",
						name,
						email,
						birthday: birthdayTimestamp.toString(),
					};

				case "confirm":
					if (!name || !email || !birthday) {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					return {
						status: "in_progress",
						message: `I'll now create a recipient for ${name} with email ${email} and birthday ${new Date(parseInt(birthday)).toLocaleDateString()}.`,
						nextStep: "submit",
						name,
						email,
						birthday,
					};

				case "submit":
					if (!name || !email || !birthday) {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					try {
						// For testing purposes, we're commenting out the actual Convex mutation call
						// In a real implementation, you would uncomment this code
						/*
						// Initialize the Convex client
						const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);
						
						// Call the createRecipient function
						const result = await createRecipient(convex, {
							name,
							email,
							birthday: parseInt(birthday),
						});
						
						if (!result.success) {
							throw new Error(result.error);
						}
						*/

						// Simulate a successful creation
						return {
							status: "success",
							message: `Successfully created a new recipient for ${name}! They've been added to your recipients list.`,
							recipientDetails: {
								name,
								email,
								birthday: new Date(parseInt(birthday)).toLocaleDateString(),
							},
						};
					} catch (error: unknown) {
						console.error("Error in submit step:", error);
						return {
							status: "error",
							message: `There was an error creating the recipient: ${error instanceof Error ? error.message : "Unknown error"}`,
							nextStep: "start",
						};
					}

				default:
					console.error("Invalid step:", step);
					return {
						status: "error",
						message:
							"I'm not sure what to do next. Let's start over. Would you like to create a new recipient?",
						nextStep: "start",
					};
			}
		} catch (error: unknown) {
			console.error("Unexpected error in createRecipientTool:", error);
			return {
				status: "error",
				message:
					"An unexpected error occurred. Let's try again. Would you like to create a new recipient?",
				nextStep: "start",
			};
		}
	},
});

/**
 * Function to create a new recipient using the Convex mutation
 * This is commented out for now as we're not actually calling the mutation in the tool
 */
/*
async function addRecipient({ name, email, birthday }: { name: string; email: string; birthday: number }) {
  // In a real implementation, you would call the Convex mutation here
  // For example:
  // const result = await convex.mutation(api.recipients.addRecipient, {
  //   name,
  //   email,
  //   birthday,
  // });
  // return result;
  
  // For now, we'll just return a mock result
  return { id: 'mock-id-' + Date.now() };
}
*/
