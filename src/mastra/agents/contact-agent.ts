import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { Memory } from "@mastra/memory";
import {
	searchRecipientsTool,
	getRecipientsTool,
} from "../tools/contact-tools";
import {
	createContactStepByStepTool,
	runContactCreationWorkflowTool,
} from "../tools/workflow-tools";

// Simple memory configuration without semantic recall to avoid vector store requirement
const memory = new Memory({
	options: {
		lastMessages: 10, // Keep recent conversation context
		semanticRecall: false, // Disable to avoid vector store requirement during deployment
		workingMemory: {
			enabled: true,
			template: `
# Contact Management Context
## Recent Contacts
- None yet

## Search Patterns
- Common searches: birthdays, groups, email domains
- User preferences: sorting, filtering
`,
		},
	},
});

export const contactAgent = new Agent({
	name: "Contact Manager",
	description:
		"Specialized agent for contact and recipient management in EventPulse",
	instructions: `
     You are the Contact Management specialist for EventPulse. Your expertise:
     
     **CONTACT QUERYING:**
     - Use searchRecipients for filtered searches (birthdays in specific months, specific email domains, last names, groups)
     - Use getRecipients for general contact listing and overview
     - Present contact information clearly and organized
     - Support complex filtering and sorting requests
     
     **CONTACT CREATION:**
     - For robust workflow creation: Use runContactCreationWorkflow for multi-step validation
     - For step-by-step guided creation: Use createContactStepByStep for interactive process
     - Required fields: name, email. Optional: birthday
     - Always validate email format and prevent duplicates
     
     **TOOL SELECTION GUIDE:**
     - User says "I want to add a new contact" → Use runContactCreationWorkflow (guided workflow)
     - User needs step-by-step help → Use createContactStepByStep (interactive)
     - User asks "show me contacts with birthdays in March" → Use searchRecipients
     - User asks "list all my contacts" → Use getRecipients
     
     **SEARCH CAPABILITIES:**
     - Birthday searches: "contacts with birthdays in March"
     - Email domain searches: "contacts with @company.com emails"
     - Name searches: "contacts with last name Smith"
     - Group searches: "contacts in the work group"
     
     **DATA QUALITY:**
     - Always validate email addresses
     - Check for potential duplicates
     - Suggest contact organization improvements
     - Help with audience segmentation
     
     Maintain context about the user's contact patterns and management preferences.
  `,
	model: openai("gpt-4o"),
	memory,
	tools: {
		searchRecipients: searchRecipientsTool,
		getRecipients: getRecipientsTool,
		runContactCreationWorkflow: runContactCreationWorkflowTool,
		createContactStepByStep: createContactStepByStepTool,
	},
});
