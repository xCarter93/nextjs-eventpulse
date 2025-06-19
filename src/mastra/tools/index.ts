// Import tools first
import { createEventTool, getUpcomingEventsTool } from "./event-tools";
import {
	createRecipientTool,
	searchRecipientsTool,
	getRecipientsTool,
} from "./contact-tools";

// Export event tools
export { createEventTool, getUpcomingEventsTool } from "./event-tools";

// Export contact tools
export {
	createRecipientTool,
	searchRecipientsTool,
	getRecipientsTool,
} from "./contact-tools";

// Tool categories for easier management
export const eventTools = {
	createEvent: createEventTool,
	getUpcomingEvents: getUpcomingEventsTool,
} as const;

export const contactTools = {
	createRecipient: createRecipientTool,
	searchRecipients: searchRecipientsTool,
	getRecipients: getRecipientsTool,
} as const;

// All tools combined
export const allMastraTools = {
	...eventTools,
	...contactTools,
} as const;
