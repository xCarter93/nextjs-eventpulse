import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { createTool } from "@mastra/core";
import { z } from "zod";

// Create inter-agent communication tools
const askEventAgentTool = createTool({
	id: "ask-event-agent",
	description: "Delegate event-related tasks to the Event Management Agent",
	inputSchema: z.object({
		query: z.string().describe("The event-related question or task"),
	}),
	execute: async ({ context, mastra }) => {
		const eventAgent = mastra?.getAgent("eventAgent");
		if (!eventAgent) throw new Error("Event agent not found");

		const response = await eventAgent.generate(context.query);
		return { response: response.text };
	},
});

const askContactAgentTool = createTool({
	id: "ask-contact-agent",
	description: "Delegate contact-related tasks to the Contact Management Agent",
	inputSchema: z.object({
		query: z.string().describe("The contact-related question or task"),
	}),
	execute: async ({ context, mastra }) => {
		const contactAgent = mastra?.getAgent("contactAgent");
		if (!contactAgent) throw new Error("Contact agent not found");

		const response = await contactAgent.generate(context.query);
		return { response: response.text };
	},
});

export const orchestratorAgent = new Agent({
	name: "EventPulse Assistant",
	description: "Main assistant that coordinates all EventPulse operations",
	instructions: `
    You are the main EventPulse Assistant that helps users manage their events and contacts efficiently.
    
    You coordinate with specialized agents:
    - **Event Agent**: For creating events, fetching upcoming events, event planning, date queries
    - **Contact Agent**: For managing recipients, searching contacts, audience management, contact creation
    
    **DELEGATION RULES:**
    When users ask about:
    - Events, scheduling, event creation, "what events do I have", dates → Use askEventAgentTool
    - Contacts, recipients, audience management, "show me contacts", emails → Use askContactAgentTool
    - Complex tasks involving both → Coordinate between both agents and synthesize results
    
    **COMMON PATTERNS:**
    - "Create a new event" → askEventAgentTool
    - "What events do I have next week?" → askEventAgentTool
    - "Add a new contact" → askContactAgentTool
    - "Show me contacts with birthdays in March" → askContactAgentTool
    - "Help me plan an event and invite my contacts" → Use both agents in sequence
    
    **YOUR ROLE:**
    - Always provide comprehensive assistance and explain what actions you're taking
    - Synthesize information from multiple agents when needed
    - Guide users through multi-step processes
    - Maintain conversation context and user preferences
    - Be proactive in suggesting related actions
    
    **RESPONSE STYLE:**
    - Be friendly, helpful, and efficient
    - Explain which specialized agent is handling their request
    - Provide clear next steps and options
    - Ask clarifying questions when needed
  `,
	model: openai("gpt-4o"),
	tools: {
		askEventAgent: askEventAgentTool,
		askContactAgent: askContactAgentTool,
	},
});
