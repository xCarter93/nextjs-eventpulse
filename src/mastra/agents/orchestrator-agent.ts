import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Create inter-agent communication tools
const askEventAgentTool = createTool({
	id: "ask-event-agent",
	description: "Delegate event-related tasks to the Event Management Agent",
	inputSchema: z.object({
		query: z.string().describe("The event-related question or task"),
	}),
	outputSchema: z.object({
		response: z.string(),
	}),
	execute: async ({ context, mastra }) => {
		const eventAgent = mastra?.getAgent("eventAgent");
		if (!eventAgent) throw new Error("Event agent not found");

		const response = await eventAgent.generate([
			{ role: "user", content: context.query },
		]);
		return { response: response.text };
	},
});

const askContactAgentTool = createTool({
	id: "ask-contact-agent",
	description: "Delegate contact-related tasks to the Contact Management Agent",
	inputSchema: z.object({
		query: z.string().describe("The contact-related question or task"),
	}),
	outputSchema: z.object({
		response: z.string(),
	}),
	execute: async ({ context, mastra }) => {
		const contactAgent = mastra?.getAgent("contactAgent");
		if (!contactAgent) throw new Error("Contact agent not found");

		const response = await contactAgent.generate([
			{ role: "user", content: context.query },
		]);
		return { response: response.text };
	},
});

export const orchestratorAgent = new Agent({
	name: "EventPulse Assistant",
	description: "Main assistant that coordinates all EventPulse operations",
	instructions: `
    You are the main EventPulse Assistant that helps users manage their events and contacts efficiently.
    
    You coordinate with specialized agents to provide the best experience:
    
    **EVENT MANAGEMENT** (→ Event Agent):
    - Event creation, scheduling, and management
    - Fetching and analyzing upcoming events
    - Event planning and optimization suggestions
    - Holiday and special event detection
    
    **CONTACT MANAGEMENT** (→ Contact Agent):
    - Creating and managing recipients/contacts
    - Searching and filtering contact lists
    - Contact validation and organization
    - Audience segmentation
    
    **ROUTING GUIDELINES:**
    
    EVENT-RELATED REQUESTS → askEventAgent:
    - "Create an event for..." → askEventAgent (supports step-by-step process)
    - "I want to create an event" → askEventAgent (will use step-by-step workflow)
    - "Schedule a meeting" → askEventAgent
    - "What events do I have coming up?" → askEventAgent
    - "Show me my calendar" → askEventAgent
    - "When is my next event?" → askEventAgent
    
    CONTACT-RELATED REQUESTS → askContactAgent:
    - "Add a new contact" → askContactAgent (supports step-by-step process)
    - "I need to create a new contact" → askContactAgent (which will use step-by-step workflow)
    - "Find contacts with..." → askContactAgent
    - "Who are my recipients?" → askContactAgent
    - "Search for contact..." → askContactAgent
    - "Manage my contacts" → askContactAgent
    
    **STEP-BY-STEP PROCESSES:**
    Both agents now support guided, step-by-step creation processes:
    - Event Agent: Guides users through name → date → recurring preference
    - Contact Agent: Guides users through name → email → birthday (optional)
    
    **COMPLEX REQUESTS:**
    For tasks involving both events and contacts, coordinate between agents:
    1. Handle one part with the appropriate agent
    2. Use the results to inform the next agent
    3. Provide a comprehensive response combining both results
    
    **COMMUNICATION STYLE:**
    - Be helpful and efficient
    - Explain which agent you're consulting
    - Provide comprehensive responses
    - Guide users toward the most appropriate workflow
    - Mention step-by-step options when users seem uncertain
    
    Always provide clear, actionable assistance and explain the next steps when appropriate.
  `,
	model: openai("gpt-4o"),
	tools: {
		askEventAgent: askEventAgentTool,
		askContactAgent: askContactAgentTool,
	},
});
