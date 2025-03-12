import { z } from "zod";
import { tool } from "ai";
import { createRecipient } from "./recipient-actions";
import { ConvexHttpClient } from "convex/browser";

/**
 * Tool for creating a new recipient
 * This tool guides the user through the process of creating a new recipient
 */
export const createRecipientTool = tool({
	description: "Create a new recipient with name, email, and birthday",
	parameters: z.object({
		step: z
			.enum([
				"start",
				"collect-name",
				"collect-email",
				"collect-birthday",
				"confirm",
				"submit",
			])
			.describe("The current step in the recipient creation process"),
		name: z
			.string()
			.describe("The recipient's name (can be empty for some steps)"),
		email: z
			.string()
			.describe(
				"The recipient's email address - must be a valid email format (can be empty for some steps)"
			),
		birthday: z
			.string()
			.describe(
				"The recipient's birthday in MM/DD/YYYY format (can be empty for some steps)"
			),
	}),
	execute: async ({ step, name, email, birthday }) => {
		// Log the input parameters for debugging
		console.log("createRecipientTool called with:", {
			step,
			name: name || "(empty)",
			email: email || "(empty)",
			birthday: birthday || "(empty)",
		});

		try {
			// Step-by-step process for creating a recipient
			switch (step) {
				case "start":
					console.log("Starting recipient creation process");
					return {
						status: "in_progress",
						message: "Let's create a new recipient. What's their name?",
						nextStep: "collect-name",
					};

				case "collect-name":
					if (!name || name.trim() === "") {
						console.log("Name missing in collect-name step");
						return {
							status: "error",
							message:
								"I need a name for the recipient. Please provide a name.",
							nextStep: "collect-name",
						};
					}
					console.log(`Name collected: ${name}`);
					return {
						status: "in_progress",
						message: `Great! Now, what's ${name}'s email address?`,
						nextStep: "collect-email",
						name,
					};

				case "collect-email":
					if (!name || name.trim() === "") {
						console.log("Name missing in collect-email step");
						return {
							status: "error",
							message:
								"I need the recipient's name first. Let's start over. What's their name?",
							nextStep: "collect-name",
						};
					}

					if (!email || email.trim() === "") {
						console.log("Email missing in collect-email step");
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
						console.log(`Invalid email format: ${email}`);
						return {
							status: "error",
							message:
								"That doesn't look like a valid email address. Please provide a valid email.",
							nextStep: "collect-email",
							name,
						};
					}

					console.log(`Email collected: ${email}`);
					return {
						status: "in_progress",
						message: `Now, when is ${name}'s birthday? Please provide it in MM/DD/YYYY format.`,
						nextStep: "collect-birthday",
						name,
						email,
					};

				case "collect-birthday":
					if (!name || name.trim() === "" || !email || email.trim() === "") {
						console.log("Missing name or email in collect-birthday step");
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					if (!birthday || birthday.trim() === "") {
						console.log("Birthday missing in collect-birthday step");
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
						console.log(`Parsing birthday: ${birthday}`);
						const [month, day, year] = birthday.split("/").map(Number);
						console.log(
							`Parsed date parts: month=${month}, day=${day}, year=${year}`
						);
						const date = new Date(year, month - 1, day);

						// Check if the date is valid
						if (isNaN(date.getTime())) {
							console.log("Invalid date detected");
							throw new Error("Invalid date");
						}

						birthdayTimestamp = date.getTime();
						console.log(`Birthday timestamp: ${birthdayTimestamp}`);
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

					console.log("Birthday collected, moving to confirmation");
					return {
						status: "in_progress",
						message: `Great! Here's a summary of the recipient:\n\nName: ${name}\nEmail: ${email}\nBirthday: ${birthday}\n\nIs this information correct? (yes/no)`,
						nextStep: "confirm",
						name,
						email,
						birthday: birthdayTimestamp.toString(),
					};

				case "confirm":
					if (
						!name ||
						name.trim() === "" ||
						!email ||
						email.trim() === "" ||
						!birthday ||
						birthday.trim() === ""
					) {
						console.log("Missing information in confirm step");
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					console.log("Confirmation received, moving to submit");
					return {
						status: "in_progress",
						message: `I'll now create a recipient for ${name} with email ${email} and birthday ${new Date(parseInt(birthday)).toLocaleDateString()}.`,
						nextStep: "submit",
						name,
						email,
						birthday,
					};

				case "submit":
					if (
						!name ||
						name.trim() === "" ||
						!email ||
						email.trim() === "" ||
						!birthday ||
						birthday.trim() === ""
					) {
						console.log("Missing information in submit step");
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					try {
						console.log("Submitting recipient data");

						// Initialize the Convex client
						const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
						if (!convexUrl) {
							throw new Error("Convex URL is not configured");
						}

						// Create the Convex client with explicit options for Edge compatibility
						const convex = new ConvexHttpClient(convexUrl);

						// Call the createRecipient function
						const result = await createRecipient(convex, {
							name,
							email,
							birthday: parseInt(birthday),
						});

						if (!result.success) {
							throw new Error(result.error);
						}

						console.log(
							"Recipient created successfully with ID:",
							result.recipientId
						);
						return {
							status: "success",
							message: `Successfully created a new recipient for ${name}! They've been added to your recipients list.`,
							recipientDetails: {
								id: result.recipientId,
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
			if (error instanceof Error) {
				console.error("Error name:", error.name);
				console.error("Error message:", error.message);
				console.error("Error stack:", error.stack);
			}
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
