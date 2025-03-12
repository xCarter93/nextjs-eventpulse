import { z } from "zod";
import { tool } from "ai";
import { createRecipient } from "./server-actions";
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
	execute: async ({
		step,
		name,
		email,
		birthday,
	}: {
		step:
			| "start"
			| "collect-name"
			| "collect-email"
			| "collect-birthday"
			| "confirm"
			| "submit";
		name: string;
		email: string;
		birthday: string;
	}) => {
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
					if (!name || name.trim() === "") {
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
					if (!name || name.trim() === "") {
						return {
							status: "error",
							message:
								"I need the recipient's name first. Let's start over. What's their name?",
							nextStep: "collect-name",
						};
					}

					if (!email || email.trim() === "") {
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
					if (!name || name.trim() === "" || !email || email.trim() === "") {
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					if (!birthday || birthday.trim() === "") {
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
						// Clean up the input - remove any extra spaces
						const cleanBirthday = birthday.trim();

						// Try multiple date formats
						let dateObj: Date | null = null;

						// First try MM/DD/YYYY format
						if (!dateObj) {
							const parts = cleanBirthday.split("/");

							if (parts.length === 3) {
								const month = parseInt(parts[0], 10);
								const day = parseInt(parts[1], 10);
								const year = parseInt(parts[2], 10);

								if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
									dateObj = new Date(year, month - 1, day);

									// Verify the date is valid
									if (
										dateObj.getMonth() !== month - 1 ||
										dateObj.getDate() !== day ||
										dateObj.getFullYear() !== year
									) {
										dateObj = null;
									}
								}
							}
						}

						// If we couldn't parse the date, throw an error
						if (!dateObj) {
							console.error(
								`DEBUGGING - Failed to parse date: ${cleanBirthday}`
							);
							throw new Error(
								`I couldn't understand the date format. Please provide the birthday in MM/DD/YYYY format (e.g., 10/02/1989).`
							);
						}

						// Get the timestamp
						birthdayTimestamp = dateObj.getTime();

						// Sanity check the year
						const year = dateObj.getFullYear();
						if (year < 1900 || year > new Date().getFullYear()) {
							console.error(`DEBUGGING - Invalid year: ${year}`);
							throw new Error(
								`The year ${year} doesn't seem right. Please provide a year between 1900 and ${new Date().getFullYear()}.`
							);
						}
					} catch (error) {
						console.error("DEBUGGING - Date validation error:", error);
						return {
							status: "error",
							message:
								error instanceof Error
									? `${error.message}`
									: "That doesn't look like a valid date. Please provide the birthday in MM/DD/YYYY format (e.g., 10/02/1989).",
							nextStep: "collect-birthday",
							name,
							email,
						};
					}

					return {
						status: "in_progress",
						message: `Great! Here's a summary of the recipient:\n\nName: ${name}\nEmail: ${email}\nBirthday: ${new Date(birthdayTimestamp).toLocaleDateString()}\n\nIs this information correct? (yes/no)`,
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
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					// Ensure birthday is a valid timestamp
					let birthdayDate: Date;
					let confirmedBirthdayTimestamp: number;
					try {
						// Try to parse the birthday as a timestamp first
						const timestampValue = Number(birthday);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							birthdayDate = new Date(timestampValue);
							confirmedBirthdayTimestamp = timestampValue;

							// Sanity check - if the date is before 1900 or after current year, it's probably wrong
							const year = birthdayDate.getFullYear();
							if (year < 1900 || year > new Date().getFullYear()) {
								console.error(
									`DEBUGGING CONFIRM - Suspicious year in timestamp: ${year}`
								);
								throw new Error(
									`The year ${year} doesn't seem right. Please provide a year between 1900 and ${new Date().getFullYear()}.`
								);
							}
						} else {
							// If it's not a valid timestamp, try to parse as MM/DD/YYYY
							// Clean up the input - remove any extra spaces
							const cleanBirthday = birthday.trim();

							// Try to parse as MM/DD/YYYY
							const parts = cleanBirthday.split("/");

							if (parts.length === 3) {
								const month = parseInt(parts[0], 10);
								const day = parseInt(parts[1], 10);
								const year = parseInt(parts[2], 10);

								if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
									birthdayDate = new Date(year, month - 1, day);

									// Verify the date is valid
									if (
										birthdayDate.getMonth() !== month - 1 ||
										birthdayDate.getDate() !== day ||
										birthdayDate.getFullYear() !== year
									) {
										throw new Error(
											`Invalid date: ${month}/${day}/${year} does not exist.`
										);
									}

									confirmedBirthdayTimestamp = birthdayDate.getTime();
								} else {
									throw new Error(
										"Invalid date format. Please use MM/DD/YYYY format."
									);
								}
							} else {
								throw new Error(
									"Invalid date format. Please use MM/DD/YYYY format."
								);
							}
						}
					} catch (error) {
						console.error("DEBUGGING CONFIRM - Error parsing birthday:", error);
						return {
							status: "error",
							message:
								error instanceof Error
									? `${error.message} Let's try again with the birthday.`
									: "There was an issue with the birthday format. Let's try again with the birthday.",
							nextStep: "collect-birthday",
							name,
							email,
						};
					}

					return {
						status: "in_progress",
						message: `I'll now create a recipient for ${name} with email ${email} and birthday ${birthdayDate.toLocaleDateString()}.`,
						nextStep: "submit",
						name,
						email,
						birthday: confirmedBirthdayTimestamp.toString(),
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
						return {
							status: "error",
							message:
								"I'm missing some information. Let's start over. What's the recipient's name?",
							nextStep: "collect-name",
						};
					}

					try {
						// Initialize the Convex client
						const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
						if (!convexUrl) {
							console.error("DEBUGGING SUBMIT - Convex URL is not configured");
							throw new Error("Convex URL is not configured");
						}

						const convex = new ConvexHttpClient(convexUrl);

						// Parse the birthday - handle both timestamp and MM/DD/YYYY format
						let birthdayTimestamp: number;

						// First try to parse as a timestamp
						const timestampValue = Number(birthday);

						if (!isNaN(timestampValue) && timestampValue > 0) {
							// It's already a timestamp
							birthdayTimestamp = timestampValue;
						} else {
							// It might be in MM/DD/YYYY format, try to parse it
							try {
								// Clean up the input - remove any extra spaces
								const cleanBirthday = birthday.trim();

								// Try to parse as MM/DD/YYYY
								const parts = cleanBirthday.split("/");

								if (parts.length === 3) {
									const month = parseInt(parts[0], 10);
									const day = parseInt(parts[1], 10);
									const year = parseInt(parts[2], 10);

									if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
										const dateObj = new Date(year, month - 1, day);

										// Verify the date is valid
										if (
											dateObj.getMonth() !== month - 1 ||
											dateObj.getDate() !== day ||
											dateObj.getFullYear() !== year
										) {
											throw new Error(
												`Invalid date: ${month}/${day}/${year} does not exist.`
											);
										}

										birthdayTimestamp = dateObj.getTime();
									} else {
										throw new Error(
											"Invalid date format. Please use MM/DD/YYYY format."
										);
									}
								} else {
									throw new Error(
										"Invalid date format. Please use MM/DD/YYYY format."
									);
								}
							} catch (error) {
								console.error("DEBUGGING SUBMIT - Error parsing date:", error);
								throw new Error(
									"Invalid birthday format. Please provide the birthday in MM/DD/YYYY format."
								);
							}
						}

						// Sanity check - convert to date and check if it's reasonable
						const birthdayDate = new Date(birthdayTimestamp);

						const year = birthdayDate.getFullYear();
						if (year < 1900 || year > new Date().getFullYear()) {
							console.error(
								`DEBUGGING SUBMIT - Suspicious year in timestamp: ${year}`
							);
							throw new Error(
								`The year ${year} doesn't seem right. Please try again with a valid date.`
							);
						}

						// Call the createRecipient function
						const result = await createRecipient(convex, {
							name,
							email,
							birthday: birthdayTimestamp,
						});

						if (!result.success) {
							console.error(
								"DEBUGGING SUBMIT - Error from createRecipient:",
								result.error
							);

							// Check for authentication-related errors
							if (
								result.error &&
								(result.error.includes("authentication") ||
									result.error.includes("logged in") ||
									result.error.includes("auth") ||
									result.error.includes("Not authenticated"))
							) {
								return {
									status: "error",
									message:
										"You need to be logged in to create a recipient. Please log in and try again.",
									nextStep: "start",
								};
							}

							throw new Error(
								result.error || "Unknown error creating recipient"
							);
						}

						return {
							status: "success",
							message: `Successfully created a new recipient for ${name}! They've been added to your recipients list.`,
							recipientDetails: {
								id: result.recipientId,
								name,
								email,
								birthday: birthdayDate.toLocaleDateString(),
							},
						};
					} catch (error: unknown) {
						console.error("DEBUGGING SUBMIT - Error in submit step:", error);

						let errorMessage = "There was an error creating the recipient.";

						if (error instanceof Error) {
							console.error("DEBUGGING SUBMIT - Error name:", error.name);
							console.error("DEBUGGING SUBMIT - Error message:", error.message);
							console.error("DEBUGGING SUBMIT - Error stack:", error.stack);

							errorMessage = error.message;

							// Check for authentication-related errors
							if (
								error.message.includes("authentication") ||
								error.message.includes("logged in") ||
								error.message.includes("auth") ||
								error.message.includes("Not authenticated")
							) {
								errorMessage =
									"You need to be logged in to create a recipient. Please log in and try again.";
							}

							// Check for birthday-related errors
							if (
								error.message.includes("birthday") ||
								error.message.includes("timestamp") ||
								error.message.includes("date")
							) {
								return {
									status: "error",
									message:
										"There was an issue with the birthday format. Let's try again with the birthday.",
									nextStep: "collect-birthday",
									name,
									email,
								};
							}
						}

						return {
							status: "error",
							message: errorMessage,
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
