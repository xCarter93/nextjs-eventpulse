// Enhanced state management for AI tool flows with better error handling and recovery

export interface ToolFlowStep {
	stepName: string;
	timestamp: number;
	data: Record<string, unknown>;
	status: "pending" | "in_progress" | "completed" | "error" | "cancelled";
	error?: string;
}

export interface ToolFlowState {
	toolName: string;
	sessionId: string;
	currentStep: string;
	steps: ToolFlowStep[];
	data: Record<string, unknown>;
	startTime: number;
	lastActivity: number;
	userId?: string;
	retryCount: number;
	maxRetries: number;
}

// Global state tracker with enhanced features
export class EnhancedToolFlowManager {
	private static instance: EnhancedToolFlowManager;
	private flows = new Map<string, ToolFlowState>();
	private cleanupInterval: NodeJS.Timeout | null = null;
	private readonly FLOW_TIMEOUT = 30 * 60 * 1000; // 30 minutes
	private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

	private constructor() {
		this.startCleanupProcess();
	}

	public static getInstance(): EnhancedToolFlowManager {
		if (!EnhancedToolFlowManager.instance) {
			EnhancedToolFlowManager.instance = new EnhancedToolFlowManager();
		}
		return EnhancedToolFlowManager.instance;
	}

	/**
	 * Start a new tool flow
	 */
	public startFlow(sessionId: string, toolName: string, userId?: string): ToolFlowState {
		const flow: ToolFlowState = {
			toolName,
			sessionId,
			currentStep: "start",
			steps: [],
			data: {},
			startTime: Date.now(),
			lastActivity: Date.now(),
			userId,
			retryCount: 0,
			maxRetries: 3,
		};

		this.flows.set(sessionId, flow);
		return flow;
	}

	/**
	 * Update a tool flow step
	 */
	public updateStep(
		sessionId: string, 
		stepName: string, 
		data: Record<string, unknown>, 
		status: ToolFlowStep["status"] = "in_progress"
	): ToolFlowState | null {
		const flow = this.flows.get(sessionId);
		if (!flow) return null;

		// Update current step
		flow.currentStep = stepName;
		flow.lastActivity = Date.now();
		
		// Merge data
		flow.data = { ...flow.data, ...data };

		// Add or update step
		const existingStepIndex = flow.steps.findIndex(step => step.stepName === stepName);
		const step: ToolFlowStep = {
			stepName,
			timestamp: Date.now(),
			data,
			status,
		};

		if (existingStepIndex >= 0) {
			flow.steps[existingStepIndex] = step;
		} else {
			flow.steps.push(step);
		}

		this.flows.set(sessionId, flow);
		return flow;
	}

	/**
	 * Mark a step as completed
	 */
	public completeStep(sessionId: string, stepName: string): ToolFlowState | null {
		const flow = this.flows.get(sessionId);
		if (!flow) return null;

		const step = flow.steps.find(s => s.stepName === stepName);
		if (step) {
			step.status = "completed";
			flow.lastActivity = Date.now();
		}

		return flow;
	}

	/**
	 * Mark a step as error and handle retry logic
	 */
	public markStepError(
		sessionId: string, 
		stepName: string, 
		error: string
	): { flow: ToolFlowState | null; shouldRetry: boolean } {
		const flow = this.flows.get(sessionId);
		if (!flow) return { flow: null, shouldRetry: false };

		const step = flow.steps.find(s => s.stepName === stepName);
		if (step) {
			step.status = "error";
			step.error = error;
		}

		flow.retryCount++;
		flow.lastActivity = Date.now();
		
		const shouldRetry = flow.retryCount < flow.maxRetries;
		
		if (!shouldRetry) {
			// Mark entire flow as failed
			flow.steps.forEach(s => {
				if (s.status === "in_progress") {
					s.status = "cancelled";
				}
			});
		}

		return { flow, shouldRetry };
	}

	/**
	 * Complete entire flow
	 */
	public completeFlow(sessionId: string): ToolFlowState | null {
		const flow = this.flows.get(sessionId);
		if (!flow) return null;

		// Mark all pending steps as completed
		flow.steps.forEach(step => {
			if (step.status === "pending" || step.status === "in_progress") {
				step.status = "completed";
			}
		});

		flow.lastActivity = Date.now();
		return flow;
	}

	/**
	 * Cancel a flow
	 */
	public cancelFlow(sessionId: string): boolean {
		const flow = this.flows.get(sessionId);
		if (!flow) return false;

		// Mark all steps as cancelled
		flow.steps.forEach(step => {
			if (step.status === "pending" || step.status === "in_progress") {
				step.status = "cancelled";
			}
		});

		this.flows.delete(sessionId);
		return true;
	}

	/**
	 * Get flow by session ID
	 */
	public getFlow(sessionId: string): ToolFlowState | null {
		return this.flows.get(sessionId) || null;
	}

	/**
	 * Get all active flows for a user
	 */
	public getUserFlows(userId: string): ToolFlowState[] {
		return Array.from(this.flows.values()).filter(flow => flow.userId === userId);
	}

	/**
	 * Get flow statistics
	 */
	public getFlowStats(): {
		totalFlows: number;
		activeFlows: number;
		completedFlows: number;
		errorFlows: number;
		averageDuration: number;
	} {
		const flows = Array.from(this.flows.values());
		
		const completedFlows = flows.filter(f => 
			f.steps.every(s => s.status === "completed")
		);
		
		const errorFlows = flows.filter(f => 
			f.steps.some(s => s.status === "error")
		);

		const activeFlows = flows.filter(f => 
			f.steps.some(s => s.status === "in_progress" || s.status === "pending")
		);

		const averageDuration = completedFlows.length > 0 
			? completedFlows.reduce((sum, f) => sum + (f.lastActivity - f.startTime), 0) / completedFlows.length
			: 0;

		return {
			totalFlows: flows.length,
			activeFlows: activeFlows.length,
			completedFlows: completedFlows.length,
			errorFlows: errorFlows.length,
			averageDuration,
		};
	}

	/**
	 * Clean up expired flows
	 */
	private cleanupExpiredFlows(): void {
		const now = Date.now();
		const expiredSessions: string[] = [];

		for (const [sessionId, flow] of this.flows.entries()) {
			if (now - flow.lastActivity > this.FLOW_TIMEOUT) {
				expiredSessions.push(sessionId);
			}
		}

		expiredSessions.forEach(sessionId => {
			console.log(`Cleaning up expired flow: ${sessionId}`);
			this.flows.delete(sessionId);
		});

		if (expiredSessions.length > 0) {
			console.log(`Cleaned up ${expiredSessions.length} expired flows`);
		}
	}

	/**
	 * Start automatic cleanup process
	 */
	private startCleanupProcess(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}

		this.cleanupInterval = setInterval(() => {
			this.cleanupExpiredFlows();
		}, this.CLEANUP_INTERVAL);
	}

	/**
	 * Stop cleanup process (for testing or shutdown)
	 */
	public stopCleanup(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
	}

	/**
	 * Clear all flows (for testing)
	 */
	public clearAllFlows(): void {
		this.flows.clear();
	}
}

// Export singleton instance
export const toolFlowManager = EnhancedToolFlowManager.getInstance();

// Legacy compatibility
export const activeToolFlows = new Map<string, {
	toolName: string;
	currentStep: string;
	data: Record<string, unknown>;
	sessionId?: string;
}>();