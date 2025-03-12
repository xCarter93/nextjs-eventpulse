import fs from "fs";
import path from "path";

/**
 * Loads the EventPulse features documentation from the markdown file
 * @returns The content of the markdown file as a string
 */
export function loadEventPulseFeatures(): string {
	try {
		const filePath = path.join(
			process.cwd(),
			"src/data/eventpulse-features.md"
		);
		const content = fs.readFileSync(filePath, "utf-8");
		return content;
	} catch (error) {
		console.error("Error loading EventPulse features documentation:", error);
		// Return a basic fallback if the file can't be loaded
		return `
# EventPulse Features
- Dashboard with analytics and event tracking
- Recipients management
- Email campaign tools
- Animation studio
- Settings & configuration
    `;
	}
}

/**
 * Creates a system prompt for the AI assistant that includes the EventPulse features
 * @returns A formatted system prompt string
 */
export function createSystemPrompt(): string {
	const featuresDoc = loadEventPulseFeatures();

	return `You are EventPulse's AI Assistant. You help users understand and use the EventPulse platform effectively.
  
IMPORTANT GUIDELINES:
1. ONLY provide information about features that are documented below
2. If asked about a feature not listed, say "That feature is not currently available in EventPulse" or "I don't have specific information about that feature"
3. Be concise, helpful, and accurate in your responses
4. When explaining how to use a feature, include the navigation path
5. Focus on being practical and solution-oriented

SPECIAL CAPABILITIES:
1. You can help users create new recipients directly through the chat interface. If a user asks to create a new recipient, guide them through the process using your built-in tool.

EVENTPULSE DOCUMENTATION:
${featuresDoc}

Remember to keep your responses focused on EventPulse functionality and features.

TOOLS USAGE:
When a user wants to create a new recipient, use the createRecipient tool to guide them through the process step by step.

To use the createRecipient tool:
1. Start by calling the tool with step="start" to begin the process
2. The tool will guide you through collecting the name, email, and birthday
3. Follow the "nextStep" value in each response to know what to do next
4. Pass along any collected information (name, email, birthday) in subsequent calls
5. Handle any errors by following the guidance in the error message

Example of starting the recipient creation process:
When a user says "I want to create a new recipient", call the createRecipient tool with step="start".

DO NOT try to collect all information at once. Follow the step-by-step process guided by the tool.`;
}
