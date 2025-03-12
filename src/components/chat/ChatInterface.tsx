"use client";

import { Button, Input } from "@heroui/react";
import { Send, Bot, Wrench, Loader2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";

interface ErrorResponse {
	error?: string;
	details?: unknown;
	[key: string]: unknown;
}

interface ToolCallInfo {
	name: string;
	parameters?: Record<string, unknown>;
	status: "running" | "completed" | "error";
	startTime: number;
}

// Define a more specific interface for the tool call
interface ExtendedToolCall {
	toolName: string;
	args: Record<string, unknown>;
	[key: string]: unknown;
}

export default function ChatInterface() {
	const [errorDetails, setErrorDetails] = useState<string | null>(null);
	const [errorType, setErrorType] = useState<string | null>(null);
	const [currentTool, setCurrentTool] = useState<ToolCallInfo | null>(null);
	// We're tracking tool history for potential future features but not using it yet
	// const [toolHistory, setToolHistory] = useState<ToolCallInfo[]>([]);

	const { messages, input, handleInputChange, handleSubmit, status, error } =
		useChat({
			api: "/api/chat",
			initialMessages: [],
			id: "eventpulse-assistant",
			body: {
				maxTokens: 1000,
				temperature: 0,
			},
			onToolCall: ({ toolCall }) => {
				// Track the tool call
				// Use type assertion with a more specific interface
				const extendedToolCall = toolCall as unknown as ExtendedToolCall;

				const newToolCall: ToolCallInfo = {
					name: extendedToolCall.toolName || "Unknown Tool",
					parameters: extendedToolCall.args || {},
					status: "running",
					startTime: Date.now(),
				};

				setCurrentTool(newToolCall);
				// setToolHistory(prev => [...prev, newToolCall]);

				// Return the tool call result (handled by the server)
				return undefined;
			},
			onResponse: () => {
				// Mark the current tool as completed when we get a response
				if (currentTool) {
					setCurrentTool((prev) =>
						prev ? { ...prev, status: "completed" } : null
					);

					// Clear the current tool after a short delay
					setTimeout(() => {
						setCurrentTool(null);
					}, 2000);
				}
			},
			onError: (error) => {
				console.error("Chat error:", error);
				// Mark the current tool as error
				if (currentTool) {
					setCurrentTool((prev) =>
						prev ? { ...prev, status: "error" } : null
					);
				}

				// Store more detailed error information
				if (error instanceof Error) {
					setErrorType(error.name);
					setErrorDetails(`${error.name}: ${error.message}`);
				} else if (typeof error === "object" && error !== null) {
					try {
						// Try to extract detailed error information from the response
						const errorObj = error as ErrorResponse;
						if (errorObj.details) {
							setErrorDetails(JSON.stringify(errorObj.details, null, 2));
							setErrorType(errorObj.error?.toString() || "Unknown Error");
						} else {
							setErrorDetails(JSON.stringify(error, null, 2));
							setErrorType("API Error");
						}
					} catch {
						setErrorDetails(String(error));
						setErrorType("Parse Error");
					}
				} else {
					setErrorDetails(String(error));
					setErrorType("Unknown Error");
				}
			},
		});

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const lastMessageContent = messages[messages.length - 1]?.content;

	// Suggested prompts for users to try
	const suggestedPrompts = [
		"How do I create a new event?",
		"What are the best practices for email reminders?",
		"Can you help me customize my event notifications?",
		"How do I manage my recipients list?",
		"I want to create a new recipient", // Add a prompt for creating a recipient
		"Find contacts with gmail addresses", // Add a prompt for searching recipients
		"What events do I have next month?", // Add a prompt for upcoming events
	];

	// Function to set input to a suggested prompt
	const handlePromptClick = (prompt: string) => {
		// Create a synthetic event that matches the expected structure
		const syntheticEvent = {
			target: { value: prompt },
		} as React.ChangeEvent<HTMLInputElement>;

		handleInputChange(syntheticEvent);
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Scroll to bottom when messages change or when streaming
	useEffect(() => {
		scrollToBottom();
	}, [messages, lastMessageContent]);

	// Display any errors
	useEffect(() => {
		if (error) {
			console.error("Chat error in component:", error);
			// You could add a toast notification here if you want
		}
	}, [error]);

	// Reset error details when starting a new chat
	const handleFormSubmit = (e: React.FormEvent) => {
		setErrorDetails(null);
		setErrorType(null);
		handleSubmit(e);
	};

	// Format parameter display for the tool call
	const formatToolParameters = (params?: Record<string, unknown>): string => {
		if (!params) return "";

		// Filter out empty or undefined values and format for display
		const filteredParams = Object.entries(params)
			.filter(([, value]) => value !== undefined && value !== "")
			.map(([key, value]) => {
				// Truncate long values
				const displayValue =
					typeof value === "string" && value.length > 20
						? `${value.substring(0, 20)}...`
						: value;
				return `${key}: ${displayValue}`;
			})
			.join(", ");

		return filteredParams ? `(${filteredParams})` : "";
	};

	return (
		<div className="flex flex-col h-[600px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-xl border border-divider relative">
			{/* Gradient Border Effect */}
			<div className="absolute inset-0 rounded-xl border border-primary/20 [background:linear-gradient(var(--background),var(--background))_padding-box,linear-gradient(to_bottom,hsl(var(--primary)),transparent)_border-box] pointer-events-none" />

			{/* Header */}
			<div className="p-4 border-b border-divider bg-background/40">
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-lg bg-primary/10">
						<Bot className="h-5 w-5 text-primary" />
					</div>
					<h3 className="font-semibold text-foreground">AI Assistant</h3>

					{/* Tool Call Status */}
					{currentTool && (
						<div className="flex items-center gap-1.5 ml-auto">
							{currentTool.status === "running" ? (
								<Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
							) : currentTool.status === "completed" ? (
								<div className="h-2 w-2 rounded-full bg-green-500"></div>
							) : (
								<div className="h-2 w-2 rounded-full bg-red-500"></div>
							)}
							<span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
								<Wrench className="h-3 w-3" />
								{currentTool.name}
								{formatToolParameters(currentTool.parameters)}
							</span>
						</div>
					)}

					{/* General Status */}
					{status === "submitted" && !currentTool && (
						<span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-auto flex items-center gap-1">
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
							Thinking...
						</span>
					)}
				</div>
			</div>

			{/* Messages Container */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{error && (
					<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
						<p className="font-medium">
							{errorType || "Error"}:{" "}
							{error.message || "Something went wrong. Please try again."}
						</p>
						{errorDetails && (
							<details className="mt-2" open>
								<summary className="cursor-pointer text-xs font-medium">
									Error Details
								</summary>
								<pre className="mt-2 p-2 bg-red-500/5 rounded text-xs overflow-auto whitespace-pre-wrap">
									{errorDetails}
								</pre>
							</details>
						)}
						<div className="mt-3 flex gap-2">
							<Button
								size="sm"
								color="danger"
								variant="light"
								onClick={() => window.location.reload()}
							>
								Reload Page
							</Button>
							<Button
								size="sm"
								color="primary"
								variant="light"
								onClick={() => {
									setErrorDetails(null);
									setErrorType(null);
								}}
							>
								Dismiss Error
							</Button>
						</div>
					</div>
				)}

				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full space-y-6 text-muted-foreground">
						<div className="p-4 rounded-full bg-primary/10">
							<Bot className="h-8 w-8 text-primary" />
						</div>
						<div className="text-center space-y-2">
							<p className="text-sm font-medium">
								Welcome to EventPulse AI Assistant!
							</p>
							<p className="text-xs max-w-md">
								I can help you with event management, recipient lists, email
								scheduling, and more. Ask me anything about EventPulse!
							</p>
						</div>

						{/* Suggested prompts */}
						<div className="w-full max-w-md space-y-2">
							<p className="text-xs font-medium text-center">Try asking:</p>
							<div className="grid grid-cols-1 gap-2">
								{suggestedPrompts.map((prompt, index) => (
									<button
										key={index}
										onClick={() => handlePromptClick(prompt)}
										className="text-xs text-left px-3 py-2 rounded-lg bg-muted hover:bg-primary/10 transition-colors"
									>
										{prompt}
									</button>
								))}
							</div>
						</div>
					</div>
				) : (
					<>
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex flex-col ${
									message.role === "user" ? "items-end" : "items-start"
								}`}
							>
								<div
									className={`rounded-lg px-4 py-2 max-w-[85%] ${
										message.role === "user"
											? "bg-primary text-primary-foreground"
											: "bg-muted"
									}`}
								>
									{message.role === "user" ? (
										<p className="whitespace-pre-wrap text-sm">
											{message.content}
										</p>
									) : (
										<div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
											<ReactMarkdown>{message.content}</ReactMarkdown>
										</div>
									)}
								</div>
							</div>
						))}
						{/* Invisible element to scroll to */}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{/* Input Form */}
			<div className="border-t border-divider bg-background/40 p-4">
				<form onSubmit={handleFormSubmit} className="flex gap-2">
					<Input
						value={input}
						onChange={handleInputChange}
						placeholder="Type a message..."
						className="flex-1 bg-background/60"
						size="sm"
						disabled={status === "submitted"}
						endContent={
							<Button
								type="submit"
								isIconOnly
								color="primary"
								size="sm"
								variant="light"
								isDisabled={!input.trim() || status === "submitted"}
								className="px-0"
							>
								<Send className="h-4 w-4" />
							</Button>
						}
					/>
				</form>
			</div>
		</div>
	);
}
