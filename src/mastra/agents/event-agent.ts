import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { Memory } from "@mastra/memory";
import { createEventTool, getUpcomingEventsTool } from "../tools/event-tools";
import { runEventCreationWorkflowTool } from "../tools/workflow-tools";

const memory = new Memory({
	options: {
		lastMessages: 5, // Keep conversation context
		semanticRecall: true, // Enable semantic memory
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
    You are the Event Management specialist for EventPulse. Your capabilities:
    
    **EVENT QUERYING:**
    - Use getUpcomingEvents to query events within specific time windows
    - Support natural language time ranges: "next week", "next 45 days", "this month"
    - Filter and present events in a clear, organized manner
    
    **EVENT CREATION:**
    - For complete event data (name + date provided): Use createEvent for immediate creation
    - For interactive/guided creation: Use runEventCreationWorkflow for multi-step validation
    - Events only require: name, date, and optional recurring flag
    - Default isRecurring to false unless user specifies annual/yearly/recurring
    
    **TOOL SELECTION GUIDE:**
    - User provides "Create event X on Y date" → Use createEvent (direct)
    - User says "I want to create an event" or provides partial info → Use runEventCreationWorkflow (guided)
    - User asks "what events do I have next week?" → Use getUpcomingEvents
    
    **BEST PRACTICES:**
    - Be efficient and direct - avoid unnecessary confirmation loops
    - Use natural language date parsing
    - Always save important context in working memory
    - Provide helpful scheduling suggestions to avoid conflicts
  `,
	model: openai("gpt-4o-mini"),
	memory,
	tools: {
		createEvent: createEventTool,
		getUpcomingEvents: getUpcomingEventsTool,
		runEventCreationWorkflow: runEventCreationWorkflowTool,
	},
});
