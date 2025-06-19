// Import tools first
import {
	createEventTool,
	getUpcomingEventsTool,
	createEventStepByStepTool,
} from "./event-tools";
import { searchRecipientsTool, getRecipientsTool } from "./contact-tools";
import {
	runEventCreationWorkflowTool,
	createContactStepByStepTool,
} from "./workflow-tools";

// Export event tools
export {
	createEventTool,
	getUpcomingEventsTool,
	createEventStepByStepTool,
} from "./event-tools";

// Export contact tools
export { searchRecipientsTool, getRecipientsTool } from "./contact-tools";

// Export workflow tools
export {
	runEventCreationWorkflowTool,
	createContactStepByStepTool,
} from "./workflow-tools";

// Tool categories for easier management
export const eventTools = {
	createEvent: createEventTool,
	getUpcomingEvents: getUpcomingEventsTool,
	runEventCreationWorkflow: runEventCreationWorkflowTool,
	createEventStepByStep: createEventStepByStepTool,
} as const;

export const contactTools = {
	searchRecipients: searchRecipientsTool,
	getRecipients: getRecipientsTool,
	createContactStepByStep: createContactStepByStepTool,
} as const;

// All tools combined
export const allMastraTools = {
	...eventTools,
	...contactTools,
} as const;
