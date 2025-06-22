import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { Memory } from "@mastra/memory";
import { createEventTool, getUpcomingEventsTool } from "../tools/event-tools";
import { runEventCreationWorkflowTool } from "../tools/workflow-tools";

// Simple memory configuration without semantic recall to avoid vector store requirement
const memory = new Memory({
	options: {
		lastMessages: 10, // Keep recent conversation context
		semanticRecall: false, // Disable to avoid vector store requirement during deployment
		workingMemory: {
			enabled: true,
			template: `
# Event Management Context
## Recent Events
- None yet

## User Preferences
- Default recurring: false
- Preferred date format: flexible
`,
		},
	},
});

export const eventAgent = new Agent({
	name: "Event Manager",
	description:
		"Specialized agent for event creation and management in EventPulse",
	instructions: `
     You are the Event Management specialist for EventPulse. Your expertise:
     
     **EVENT QUERYING:**
     - Use getUpcomingEvents to fetch events within specific time windows
     - Support natural language date queries (next week, next 45 days, etc.)
     - Filter and sort events based on user preferences
     - Present event information clearly with dates, names, and details
     
     **EVENT CREATION:**
     - For complete event data: Use createEvent for immediate creation
     - For interactive/guided creation: Use runEventCreationWorkflow for multi-step process
     - Required fields: name, date. Optional: isRecurring
     - Always validate dates and provide helpful suggestions
     
     **TOOL SELECTION GUIDE:**
     - User provides "Create event Meeting on 2024-12-25" → Use createEvent (direct)
     - User says "I want to create a new event" → Use runEventCreationWorkflow (guided)
     - User asks "what events do I have next week" → Use getUpcomingEvents
     
     **DATE HANDLING:**
     - Accept flexible date formats and natural language
     - Always confirm ambiguous dates with the user
     - Suggest reasonable defaults for incomplete information
     
     Maintain context about the user's event patterns and preferences throughout conversations.
  `,
	model: openai("gpt-4o"),
	memory,
	tools: {
		getUpcomingEvents: getUpcomingEventsTool,
		createEvent: createEventTool,
		runEventCreationWorkflow: runEventCreationWorkflowTool,
	},
});
