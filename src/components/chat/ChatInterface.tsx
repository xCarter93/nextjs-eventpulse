"use client";

import { Button, Input } from "@heroui/react";
import { Send, Bot } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";

interface ErrorResponse {
	error?: string;
	details?: unknown;
	[key: string]: unknown;
}

export default function ChatInterface() {
	const [errorDetails, setErrorDetails] = useState<string | null>(null);
	const [errorType, setErrorType] = useState<string | null>(null);

	const { messages, input, handleInputChange, handleSubmit, status, error } =
		useChat({
			api: "/api/chat",
			initialMessages: [],
			id: "eventpulse-assistant",
			body: {
				maxTokens: 1000,
				temperature: 0,
			},
			onError: (error) => {
				console.error("Chat error:", error);
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
					{status === "submitted" && (
						<span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2">
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
