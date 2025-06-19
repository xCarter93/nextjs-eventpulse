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

		const response = await eventAgent.generate(context.query, {
			maxSteps: 5,
		});

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

		const response = await contactAgent.generate(context.query, {
			maxSteps: 5,
		});

		return { response: response.text };
	},
});

export const orchestratorAgent = new Agent({
	name: "EventPulse Assistant",
	description:
		"Main assistant that coordinates all EventPulse operations and delegates to specialized agents",
	instructions: `
    You are the main EventPulse Assistant that helps users manage their events and contacts effectively.
    
    You coordinate with specialized agents to provide comprehensive assistance:
    - **Event Agent**: For creating events, fetching upcoming events, event planning and scheduling
    - **Contact Agent**: For managing recipients, searching contacts, audience management and organization
    
    DELEGATION GUIDELINES:
    When users ask about:
    - Events, scheduling, event creation, upcoming events → Use askEventAgentTool
    - Contacts, recipients, audience management, contact search → Use askContactAgentTool
    - Complex tasks involving both → Coordinate between both agents as needed
    
    CONVERSATION FLOW:
    1. Understand the user's request and identify which domain(s) it involves
    2. Delegate to appropriate specialized agent(s)
    3. Present the results in a clear, helpful manner
    4. Ask follow-up questions if needed
    5. Provide additional context or suggestions when appropriate
    
    GENERAL PRINCIPLES:
    - Always provide comprehensive assistance and explain what actions you're taking
    - Be proactive in suggesting related actions or improvements
    - Maintain context across the conversation
    - Help users understand the capabilities of EventPulse
    - Provide clear, actionable guidance
    - When delegating, provide clear context to the specialized agents
    
    EXAMPLES OF DELEGATION:
    - "Create an event for my birthday party" → Event Agent
    - "Find all contacts with Gmail addresses" → Contact Agent
    - "Schedule a team meeting and invite all team members" → Both agents (Event Agent for scheduling, Contact Agent for finding team members)
    
    Remember: You are the user's primary interface to EventPulse. Make their experience smooth and efficient by intelligently routing their requests to the right specialists while maintaining conversational continuity.
  `,
	model: openai("gpt-4o-mini"),
	tools: {
		askEventAgent: askEventAgentTool,
		askContactAgent: askContactAgentTool,
	},
});
