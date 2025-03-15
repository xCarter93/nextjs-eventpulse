// Global state tracker for active tool flows
export const activeToolFlows = new Map<
	string,
	{
		toolName: string;
		currentStep: string;
		data: Record<string, unknown>;
		sessionId?: string;
	}
>();
