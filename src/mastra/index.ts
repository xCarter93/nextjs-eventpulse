import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { LangfuseExporter } from "langfuse-vercel";
import { eventAgent } from "./agents/event-agent";
import { contactAgent } from "./agents/contact-agent";
import { orchestratorAgent } from "./agents/orchestrator-agent";
import { eventCreationWorkflow, contactCreationWorkflow } from "./workflows";
import { env } from "@/env";

export const mastra = new Mastra({
	agents: {
		eventAgent,
		contactAgent,
		orchestratorAgent,
	},
	workflows: {
		eventCreationWorkflow,
		contactCreationWorkflow,
	},
	telemetry: {
		serviceName: "ai", // this must be set to "ai" so that the LangfuseExporter thinks it's an AI SDK trace
		enabled: true,
		export: {
			type: "custom",
			exporter: new LangfuseExporter({
				publicKey: env.LANGFUSE_PUBLIC_KEY,
				secretKey: env.LANGFUSE_SECRET_KEY,
				baseUrl: env.LANGFUSE_HOST,
			}),
		},
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
