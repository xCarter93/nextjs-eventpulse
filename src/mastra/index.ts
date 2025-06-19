import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";

import { eventAgent } from "./agents/event-agent";
import { contactAgent } from "./agents/contact-agent";
import { orchestratorAgent } from "./agents/orchestrator-agent";

export const mastra = new Mastra({
	agents: {
		eventAgent,
		contactAgent,
		orchestratorAgent,
	},
	logger: new PinoLogger({
		name: "EventPulse-Mastra",
		level: "info",
	}),
});

// Export agents for easy access
export { eventAgent, contactAgent, orchestratorAgent };

// Export tools for backward compatibility
export * from "./tools";
