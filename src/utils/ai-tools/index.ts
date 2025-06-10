// Export new simplified tools (recommended - use these!)
export { createEventTool, askForEventInfoTool } from "./create-event-tool";
export {
	createRecipientTool,
	askForRecipientInfoTool,
} from "./create-recipient-tool";
export { searchRecipientsTool } from "./search-recipients-tool";

// Export existing tools that are already simple
export * from "./get-upcoming-events-tool";
export { getRecipientsTool } from "./get-recipients-tool";

// Export simplified tools configuration (recommended entry point)
export * from "./simplified-tools-config";

// Export TypeScript types for better development experience
export * from "./types";
