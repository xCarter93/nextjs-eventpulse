"use client";

import { Button, Input } from "@heroui/react";
import { Send, Bot } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef } from "react";

export default function ChatInterface() {
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
			},
		});

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const lastMessageContent = messages[messages.length - 1]?.content;

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
			console.error("Chat error:", error);
		}
	}, [error]);

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
						Error: {error.message || "Something went wrong. Please try again."}
					</div>
				)}

				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground">
						<div className="p-4 rounded-full bg-primary/10">
							<Bot className="h-8 w-8 text-primary" />
						</div>
						<p className="text-sm">Start a conversation with AI Assistant</p>
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
				<form onSubmit={handleSubmit} className="flex gap-2">
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
