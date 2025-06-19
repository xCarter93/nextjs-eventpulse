// Import tools first
import { createEventTool, getUpcomingEventsTool } from "./event-tools";
import {
	createRecipientTool,
	searchRecipientsTool,
	getRecipientsTool,
} from "./contact-tools";
import {
	runEventCreationWorkflowTool,
	runContactCreationWorkflowTool,
} from "./workflow-tools";

// Export event tools
export { createEventTool, getUpcomingEventsTool } from "./event-tools";

// Export contact tools
export {
	createRecipientTool,
	searchRecipientsTool,
	getRecipientsTool,
} from "./contact-tools";

// Export workflow tools
export {
	runEventCreationWorkflowTool,
	runContactCreationWorkflowTool,
} from "./workflow-tools";

// Tool categories for easier management
export const eventTools = {
	createEvent: createEventTool,
	getUpcomingEvents: getUpcomingEventsTool,
	runEventCreationWorkflow: runEventCreationWorkflowTool,
} as const;

export const contactTools = {
	createRecipient: createRecipientTool,
	searchRecipients: searchRecipientsTool,
	getRecipients: getRecipientsTool,
	runContactCreationWorkflow: runContactCreationWorkflowTool,
} as const;

// All tools combined
export const allMastraTools = {
	...eventTools,
	...contactTools,
} as const;
