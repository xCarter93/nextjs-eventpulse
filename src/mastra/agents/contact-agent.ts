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

const memory = new Memory({
	options: {
		lastMessages: 5, // Keep conversation context
		semanticRecall: true, // Enable semantic memory
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
    You are the Contact Management specialist for EventPulse. Your capabilities:
    
    **CONTACT QUERYING:**
    - Use searchRecipients for specific criteria: birthdays in a month, email addresses, last names, groups
    - Use getRecipients for general contact listing
    - Support complex queries like "contacts with birthdays in March" or "contacts in Marketing group"
    
    **CONTACT CREATION:**
    - For complete contact data: Use runContactCreationWorkflow for robust validation and creation
    - For guided interactive creation: Use createContactStepByStep for conversational process
    - Required fields: name, email. Optional: birthday
    - Always ensure data validation and quality

    **TOOL SELECTION GUIDE:**
    - User provides complete info "Add contact John Smith john@email.com" → Use runContactCreationWorkflow (robust validation)
    - User says "I want to add a new contact" or provides partial info → Use createContactStepByStep (guided)
    - User asks "show me contacts with birthdays in March" → Use searchRecipients
    - User asks "list all my contacts" → Use getRecipients
    
    **BEST PRACTICES:**
    - Always use workflow validation for data quality
    - Guide users through step-by-step process when needed
    - Save search patterns and user preferences in working memory
    - Suggest contact organization strategies
    - Present results in clear, organized format
  `,
	model: openai("gpt-4o-mini"),
	memory,
	tools: {
		searchRecipients: searchRecipientsTool,
		getRecipients: getRecipientsTool,
		runContactCreationWorkflow: runContactCreationWorkflowTool,
		createContactStepByStep: createContactStepByStepTool,
	},
});
