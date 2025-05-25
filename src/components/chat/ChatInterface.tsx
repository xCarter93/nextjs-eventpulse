"use client";

import { Button, Input } from "@heroui/react";
import {
	Send,
	Loader2,
	Sparkles,
	Calendar,
	Users,
	Search,
	HelpCircle,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	EventCreated,
	RecipientCreated,
	EventsList,
	RecipientsList,
	ToolLoading,
} from "@/utils/ai-tools";

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
				maxTokens: 2000,
				temperature: 0.1,
			},
			// Remove complex onToolCall logic - let the SDK handle it
			onError: (error) => {
				console.error("Chat error:", error);
				// Store error information for display
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
						setErrorType("Unknown Error");
					}
				} else {
					setErrorDetails(String(error));
					setErrorType("Unknown Error");
				}
			},
		});

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const lastMessageContent = messages[messages.length - 1]?.content;

	// Capabilities overview instead of specific prompts
	const capabilities = [
		{
			icon: <Calendar className="h-4 w-4" />,
			title: "Event Management",
			description: "Create, find, and manage your events and calendar",
		},
		{
			icon: <Users className="h-4 w-4" />,
			title: "Contact Management",
			description: "Add and search for contacts in your network",
		},
		{
			icon: <Search className="h-4 w-4" />,
			title: "Smart Search",
			description: "Find upcoming events, birthdays, and contacts",
		},
		{
			icon: <HelpCircle className="h-4 w-4" />,
			title: "Platform Guidance",
			description: "Learn about EventPulse features and best practices",
		},
	];

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

	// Reset errors when starting a new conversation
	const handleFormSubmit = (e: React.FormEvent) => {
		setErrorDetails(null);
		setErrorType(null);
		handleSubmit(e);
	};

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	return (
		<div className="flex flex-col h-[600px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-xl border border-divider relative overflow-hidden">
			{/* Gradient Border Effect */}
			<div className="absolute inset-0 rounded-xl border border-primary/20 [background:linear-gradient(var(--background),var(--background))_padding-box,linear-gradient(to_bottom,hsl(var(--primary)),transparent)_border-box] pointer-events-none" />

			{/* Header with Status Indicators - Simplified */}
			<div className="p-2 border-b border-divider bg-background/40 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center shadow-sm">
						<div className="text-[10px] font-bold text-primary-foreground">
							P
						</div>
					</div>
					<span className="text-xs font-medium text-foreground">Pulsy</span>
				</div>

				<div className="flex items-center">
					{status === "submitted" && (
						<motion.span
							className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
							Thinking...
						</motion.span>
					)}
				</div>
			</div>

			{/* Messages Container - Adjusted to take full height */}
			<div className="flex-1 overflow-y-auto p-3 space-y-3">
				{error && (
					<motion.div
						className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ type: "spring" }}
					>
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
					</motion.div>
				)}

				{messages.length === 0 ? (
					<motion.div
						className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground px-2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5 }}
					>
						{/* Pulsy Avatar */}
						<motion.div
							className="relative"
							initial={{ scale: 0.8, rotate: -10 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{
								type: "spring",
								stiffness: 260,
								damping: 20,
								delay: 0.2,
							}}
						>
							<div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center shadow-lg">
								<div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
									<div className="text-2xl font-bold text-primary">P</div>
								</div>
							</div>
							<motion.div
								className="absolute -top-2 -right-2"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.8 }}
							>
								<Sparkles className="h-5 w-5 text-yellow-400" />
							</motion.div>
							<motion.div
								className="absolute -bottom-1 -left-1"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 1.0 }}
							>
								<Calendar className="h-4 w-4 text-primary" />
							</motion.div>
						</motion.div>

						<motion.div
							className="text-center space-y-2"
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.4 }}
						>
							<motion.h2
								className="text-lg font-bold text-foreground"
								initial={{ y: 10, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.5 }}
							>
								Hi, I&apos;m Pulsy!
							</motion.h2>
							<motion.p
								className="text-xs max-w-sm"
								initial={{ y: 10, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 0.6 }}
							>
								Your EventPulse assistant, ready to help you manage your events
								and contacts with ease. Just ask me anything!
							</motion.p>
						</motion.div>

						{/* Capabilities Overview */}
						<motion.div
							className="w-full max-w-sm space-y-3 px-2"
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.7 }}
						>
							<p className="text-xs font-medium text-center text-primary">
								My Capabilities
							</p>
							<div className="grid grid-cols-2 gap-2">
								{capabilities.map((capability, index) => (
									<motion.div
										key={index}
										className="bg-muted/50 rounded-lg p-2 flex flex-col gap-1 border border-primary/10 hover:border-primary/30 transition-colors"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.8 + index * 0.1 }}
										whileHover={{ y: -2 }}
									>
										<div className="flex items-center gap-1.5">
											<div className="p-1 rounded-md bg-primary/10 text-primary">
												{capability.icon}
											</div>
											<h4 className="font-medium text-xs">
												{capability.title}
											</h4>
										</div>
										<p className="text-[10px] text-muted-foreground leading-tight">
											{capability.description}
										</p>
									</motion.div>
								))}
							</div>
							<motion.p
								className="text-[10px] text-center text-muted-foreground mt-2"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1.3 }}
							>
								Just type your question or request below to get started!
							</motion.p>
						</motion.div>
					</motion.div>
				) : (
					<>
						<AnimatePresence>
							{messages.map((message) => (
								<motion.div
									key={message.id}
									className={`flex items-start gap-2 ${
										message.role === "user" ? "flex-row-reverse" : "flex-row"
									}`}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ type: "spring", stiffness: 200, damping: 20 }}
								>
									{/* Avatar for messages */}
									<div
										className={`flex-shrink-0 ${message.role === "user" ? "ml-1" : "mr-1"}`}
									>
										{message.role === "user" ? (
											<div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground">
												You
											</div>
										) : (
											<div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center shadow-sm">
												<div className="text-[10px] font-bold text-primary-foreground">
													P
												</div>
											</div>
										)}
									</div>

									<motion.div
										className={`rounded-lg px-3 py-2 max-w-[80%] ${
											message.role === "user"
												? "bg-primary text-primary-foreground"
												: "bg-muted"
										}`}
										initial={{ scale: 0.95 }}
										animate={{ scale: 1 }}
										transition={{ type: "spring", stiffness: 300, damping: 20 }}
									>
										{message.role === "user" ? (
											<p className="whitespace-pre-wrap text-sm">
												{message.content}
											</p>
										) : (
											<>
												{/* Render text content */}
												{message.content && (
													<div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-full overflow-x-auto">
														<ReactMarkdown>{message.content}</ReactMarkdown>
													</div>
												)}

												{/* Render tool invocations */}
												{message.toolInvocations?.map((toolInvocation) => {
													const { toolName, toolCallId, state } =
														toolInvocation;

													if (state === "result") {
														const { result } = toolInvocation;

														switch (toolName) {
															case "createEvent":
																return (
																	<EventCreated key={toolCallId} {...result} />
																);
															case "createRecipient":
																return (
																	<RecipientCreated
																		key={toolCallId}
																		{...result}
																	/>
																);
															case "searchEvents":
																return (
																	<EventsList key={toolCallId} {...result} />
																);
															case "searchRecipients":
																return (
																	<RecipientsList
																		key={toolCallId}
																		{...result}
																	/>
																);
															default:
																return (
																	<div
																		key={toolCallId}
																		className="p-3 bg-gray-50 rounded-lg"
																	>
																		<pre className="text-xs overflow-auto">
																			{JSON.stringify(result, null, 2)}
																		</pre>
																	</div>
																);
														}
													} else {
														return (
															<ToolLoading
																key={toolCallId}
																toolName={toolName}
															/>
														);
													}
												})}
											</>
										)}
									</motion.div>
								</motion.div>
							))}

							{/* Invisible element to scroll to */}
							<div ref={messagesEndRef} />
						</AnimatePresence>
					</>
				)}
			</div>

			{/* Input Form */}
			<div className="border-t border-divider bg-background/40 p-3">
				<motion.form
					onSubmit={handleFormSubmit}
					className="flex gap-2"
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
				>
					<Input
						value={input}
						onChange={handleInputChange}
						placeholder="Ask Pulsy something..."
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
								<Send className="h-3.5 w-3.5" />
							</Button>
						}
					/>
				</motion.form>
			</div>
		</div>
	);
}
