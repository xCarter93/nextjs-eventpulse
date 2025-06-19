"use client";

import {
	Button,
	Input,
	Card,
	CardBody,
	Avatar,
	Chip,
	ScrollShadow,
} from "@heroui/react";
import {
	Send,
	Loader2,
	Sparkles,
	Calendar,
	Users,
	Search,
	HelpCircle,
	Bot,
	User,
	CheckCircle,
	AlertCircle,
	Settings,
	Trash2,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
	id: string;
}

// Define a more specific interface for the tool call
interface ExtendedToolCall {
	toolName: string;
	args: Record<string, unknown>;
	id?: string;
	[key: string]: unknown;
}

export default function ChatInterface() {
	const [errorDetails, setErrorDetails] = useState<string | null>(null);
	const [errorType, setErrorType] = useState<string | null>(null);
	const [currentTool, setCurrentTool] = useState<ToolCallInfo | null>(null);
	// Track tool history for displaying steps
	const [toolHistory, setToolHistory] = useState<ToolCallInfo[]>([]);
	// Add a flag to track if we've received an answer
	const [hasReceivedAnswer, setHasReceivedAnswer] = useState<boolean>(false);
	// Add a flag to track if we've shown the tool history for the current response
	const [hasShownToolHistory, setHasShownToolHistory] =
		useState<boolean>(false);
	// Add a flag to track the current conversation ID to prevent duplicate tool calls
	const [currentConversationId, setCurrentConversationId] =
		useState<string>("");
	// Track already processed tool call IDs to prevent duplicates
	const processedToolCallIds = useRef(new Set<string>());
	// Flag to track if we've already logged the finish message
	const [finishLogged, setFinishLogged] = useState<boolean>(false);

	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		status,
		error,
		id,
		setMessages,
	} = useChat({
		api: "/api/chat",
		initialMessages: [],
		id: "eventpulse-assistant",
		body: {
			maxTokens: 1000,
			temperature: 0,
		},
		onToolCall: ({ toolCall }) => {
			// Use type assertion with a more specific interface
			const extendedToolCall = toolCall as unknown as ExtendedToolCall;
			console.log("Tool call received:", extendedToolCall);

			// Generate a unique ID for this tool call if it doesn't have one
			const toolId =
				extendedToolCall.id ||
				`tool-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

			// Check if we've already processed this exact tool call
			if (processedToolCallIds.current.has(toolId)) {
				console.log(`Already processed tool call ID ${toolId}, ignoring`);
				return undefined;
			}

			// If we've already received a final answer, don't process new tool calls
			if (hasReceivedAnswer) {
				console.log("Answer already received, ignoring new tool call");
				return undefined;
			}

			// Add this tool call ID to the processed set
			processedToolCallIds.current.add(toolId);

			const newToolCall: ToolCallInfo = {
				name: extendedToolCall.toolName || "Unknown Tool",
				parameters: extendedToolCall.args || {},
				status: "running",
				startTime: Date.now(),
				id: toolId,
			};

			// Reset the hasShownToolHistory flag when a new tool call is made
			setHasShownToolHistory(false);

			// Update the current conversation ID if it's not set
			if (!currentConversationId) {
				setCurrentConversationId(id);
			}

			setCurrentTool(newToolCall);

			// Only add to history if it's not a duplicate (same name and parameters)
			setToolHistory((prev) => {
				// Check if we already have this exact tool call in the history by comparing parameters
				const isDuplicate = prev.some(
					(tool) =>
						tool.name === newToolCall.name &&
						JSON.stringify(tool.parameters) ===
							JSON.stringify(newToolCall.parameters)
				);

				if (isDuplicate) {
					console.log("Duplicate tool call detected, not adding to history");
					return prev;
				}

				return [...prev, newToolCall];
			});

			// Return undefined to let the SDK handle the tool call
			return undefined;
		},
		onResponse: (response) => {
			console.log("Response received:", response);

			// Only update tool status if this response is about a tool
			if (currentTool) {
				const updatedTool = { ...currentTool, status: "completed" as const };
				setCurrentTool(null);

				// Update the tool in history
				setToolHistory((prev) =>
					prev.map((tool) => (tool.id === updatedTool.id ? updatedTool : tool))
				);
			}
		},
		onError: (error) => {
			console.error("Chat error:", error);
			// Mark the current tool as error
			if (currentTool) {
				const updatedTool = { ...currentTool, status: "error" as const };
				setCurrentTool(null);

				// Update the tool in history
				setToolHistory((prev) =>
					prev.map((tool) => (tool.id === updatedTool.id ? updatedTool : tool))
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
					setErrorType("Unknown Error");
				}
			} else {
				setErrorDetails(String(error));
				setErrorType("Unknown Error");
			}
		},
		onFinish: () => {
			// Check if the last message has content - this is when we know a final answer was provided
			const lastMessage = messages[messages.length - 1];
			if (
				!finishLogged &&
				lastMessage &&
				lastMessage.role === "assistant" &&
				lastMessage.content &&
				typeof lastMessage.content === "string" &&
				lastMessage.content.trim().length > 0
			) {
				console.log(
					"Text response received, tool calls should stop after this step"
				);
				setFinishLogged(true);

				// Set flags to prevent further tool calls
				setHasReceivedAnswer(true);
				setHasShownToolHistory(true);
			}

			// When the entire response is finished, ensure all tools are marked as completed
			setToolHistory((prev) =>
				prev.map((tool) => ({ ...tool, status: "completed" as const }))
			);

			// Clear current tool to stop any remaining spinners
			setCurrentTool(null);

			// Ensure we've shown the tool history
			setHasShownToolHistory(true);
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

	// Function to clear all chat data
	const clearChatHistory = () => {
		setMessages([]);
		setErrorDetails(null);
		setErrorType(null);
		setToolHistory([]);
		setHasReceivedAnswer(false);
		setHasShownToolHistory(false);
		processedToolCallIds.current.clear();
		setCurrentTool(null);
		setFinishLogged(false);
		setCurrentConversationId("");
	};

	// Clear chat history when component unmounts (chat window closes)
	useEffect(() => {
		const processedIds = processedToolCallIds.current;
		return () => {
			setMessages([]);
			setErrorDetails(null);
			setErrorType(null);
			setToolHistory([]);
			setHasReceivedAnswer(false);
			setHasShownToolHistory(false);
			processedIds.clear();
			setCurrentTool(null);
			setFinishLogged(false);
			setCurrentConversationId("");
		};
	}, [setMessages]);

	// Display any errors
	useEffect(() => {
		if (error) {
			console.error("Chat error in component:", error);
			// You could add a toast notification here if you want
		}
	}, [error]);

	// Reset everything when starting a new conversation
	const handleFormSubmit = (e: React.FormEvent) => {
		setErrorDetails(null);
		setErrorType(null);

		// Clear tool history and reset all flags for each new user message
		setToolHistory([]);
		setHasReceivedAnswer(false);
		setHasShownToolHistory(false);
		processedToolCallIds.current.clear();
		setCurrentTool(null);
		setFinishLogged(false); // Reset the finish logged flag

		// If the conversation ID has changed, update it
		if (id !== currentConversationId) {
			setCurrentConversationId(id);
		}

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

	// Simplify the useEffect that detects when a new assistant message is received
	// since we're now handling most of this logic in onResponse and onFinish
	useEffect(() => {
		// If we have a new assistant message and it has content, mark all tools as completed
		if (
			!finishLogged &&
			messages.length > 0 &&
			messages[messages.length - 1].role === "assistant" &&
			messages[messages.length - 1].content &&
			typeof messages[messages.length - 1].content === "string" &&
			messages[messages.length - 1].content.trim().length > 0
		) {
			console.log(
				"Assistant provided an answer, marking all tools as completed"
			);
			setFinishLogged(true);

			// Mark all tools as completed
			setToolHistory((prev) =>
				prev.map((tool) => ({ ...tool, status: "completed" as const }))
			);

			// Set flags to prevent further tool calls
			setHasReceivedAnswer(true);
			setHasShownToolHistory(true);

			// Clear current tool to stop any remaining spinners
			setCurrentTool(null);
		}
	}, [messages, finishLogged]);

	return (
		<div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] min-h-[500px] w-full max-w-4xl mx-auto">
			<Card className="flex-1 flex flex-col shadow-xl border-0 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-md">
				{/* Header with Pulsy and Tool Status */}
				<div className="border-b border-divider/50 bg-background/60 backdrop-blur-sm">
					{/* Top row with avatar, name, and controls */}
					<div className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<Avatar
								src=""
								icon={<Bot className="h-5 w-5" />}
								className="bg-gradient-to-br from-primary to-secondary"
								size="sm"
							/>
							<div className="flex flex-col">
								<h2 className="text-sm font-semibold text-foreground">Pulsy</h2>
								<p className="text-xs text-muted-foreground">
									EventPulse Assistant
								</p>
							</div>
						</div>

						{/* Status Indicator and Controls */}
						<div className="flex items-center gap-2">
							{error && (
								<Chip
									size="sm"
									variant="flat"
									color="danger"
									startContent={<AlertCircle className="h-3 w-3" />}
								>
									Error
								</Chip>
							)}
							{messages.length > 0 && (
								<Button
									isIconOnly
									variant="light"
									size="sm"
									className="text-muted-foreground hover:text-danger"
									onClick={clearChatHistory}
									title="Clear chat history"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
							<Button
								isIconOnly
								variant="light"
								size="sm"
								className="text-muted-foreground"
							>
								<Settings className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Tool Status Section - Now shown in header */}
					{(currentTool ||
						(toolHistory.length > 0 && !hasShownToolHistory)) && (
						<div className="px-4 pb-4">
							<Card className="bg-default-50 border-primary/20">
								<CardBody className="p-3">
									<div className="flex items-center gap-2 mb-2">
										{currentTool ? (
											<>
												<Loader2 className="h-4 w-4 text-primary animate-spin" />
												<p className="text-sm font-medium text-primary">
													Processing your request...
												</p>
											</>
										) : (
											<>
												<CheckCircle className="h-4 w-4 text-success" />
												<p className="text-sm font-medium text-success">
													Task completed
												</p>
											</>
										)}
									</div>

									<div className="space-y-2">
										{toolHistory
											.reduce((unique, current) => {
												const existingTool = unique.find(
													(tool) => tool.name === current.name
												);
												if (
													!existingTool ||
													existingTool.startTime < current.startTime
												) {
													if (existingTool) {
														unique = unique.filter(
															(tool) => tool.name !== current.name
														);
													}
													unique.push(current);
												}
												return unique;
											}, [] as ToolCallInfo[])
											.sort((a, b) => a.startTime - b.startTime)
											.map((tool, index) => (
												<motion.div
													key={tool.id}
													className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: index * 0.1 }}
												>
													{tool.status === "completed" ? (
														<CheckCircle className="h-3 w-3 text-success" />
													) : tool.status === "error" ? (
														<AlertCircle className="h-3 w-3 text-danger" />
													) : (
														<Loader2 className="h-3 w-3 text-primary animate-spin" />
													)}

													<div className="flex-1 min-w-0">
														<p className="text-xs font-medium truncate">
															{tool.name}
														</p>
														{Object.keys(tool.parameters || {}).length > 0 && (
															<p className="text-xs text-muted-foreground truncate">
																{formatToolParameters(tool.parameters)}
															</p>
														)}
													</div>

													<Chip
														size="sm"
														variant="flat"
														color={
															tool.status === "completed"
																? "success"
																: tool.status === "error"
																	? "danger"
																	: "primary"
														}
														className="text-xs"
													>
														{tool.status}
													</Chip>
												</motion.div>
											))}
									</div>
								</CardBody>
							</Card>
						</div>
					)}
				</div>

				{/* Messages Container with ScrollShadow */}
				<CardBody className="flex-1 p-0 overflow-hidden">
					<ScrollShadow className="flex-1 h-full" hideScrollBar size={20}>
						<div className="p-4 space-y-4 min-h-full">
							{/* Error Display */}
							{error && (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									className="mx-4"
								>
									<Card className="border-danger/20 bg-danger/5">
										<CardBody className="p-4">
											<div className="flex items-start gap-3">
												<AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
												<div className="flex-1">
													<p className="font-medium text-danger text-sm">
														{errorType || "Error"}
													</p>
													<p className="text-sm text-danger/80 mt-1">
														{error.message ||
															"Something went wrong. Please try again."}
													</p>
													{errorDetails && (
														<details className="mt-3">
															<summary className="cursor-pointer text-xs font-medium text-danger/70 hover:text-danger">
																Show Details
															</summary>
															<Card className="mt-2 bg-danger/5 border border-danger/10">
																<CardBody className="p-3">
																	<pre className="text-xs text-danger/80 whitespace-pre-wrap overflow-auto">
																		{errorDetails}
																	</pre>
																</CardBody>
															</Card>
														</details>
													)}
													<div className="flex gap-2 mt-3">
														<Button
															size="sm"
															color="danger"
															variant="flat"
															onClick={() => window.location.reload()}
														>
															Reload
														</Button>
														<Button
															size="sm"
															variant="light"
															onClick={() => {
																setErrorDetails(null);
																setErrorType(null);
															}}
														>
															Dismiss
														</Button>
													</div>
												</div>
											</div>
										</CardBody>
									</Card>
								</motion.div>
							)}

							{/* Welcome Screen */}
							{messages.length === 0 ? (
								<motion.div
									className="flex flex-col items-center justify-center h-full space-y-6 px-4 py-8"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6 }}
								>
									{/* Hero Avatar */}
									<motion.div
										className="relative"
										initial={{ scale: 0.8 }}
										animate={{ scale: 1 }}
										transition={{
											type: "spring",
											stiffness: 200,
											damping: 15,
											delay: 0.2,
										}}
									>
										<Avatar
											src=""
											icon={<Bot className="h-12 w-12" />}
											className="w-24 h-24 bg-gradient-to-br from-primary via-secondary to-primary shadow-2xl"
										/>
										<motion.div
											className="absolute -top-2 -right-2"
											initial={{ scale: 0, rotate: -180 }}
											animate={{ scale: 1, rotate: 0 }}
											transition={{ delay: 0.8, type: "spring" }}
										>
											<div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
												<Sparkles className="h-4 w-4 text-white" />
											</div>
										</motion.div>
									</motion.div>

									{/* Welcome Text */}
									<motion.div
										className="text-center space-y-3 max-w-md"
										initial={{ y: 20, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 0.4 }}
									>
										<h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
											Welcome to Pulsy!
										</h1>
										<p className="text-sm text-muted-foreground leading-relaxed">
											Your intelligent EventPulse assistant is here to help you
											manage events, contacts, and discover what&apos;s
											happening in your world.
										</p>
									</motion.div>

									{/* Capabilities Grid */}
									<motion.div
										className="w-full max-w-lg"
										initial={{ y: 20, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 0.6 }}
									>
										<p className="text-sm font-medium text-center text-primary mb-4">
											What I can help you with
										</p>
										<div className="grid grid-cols-2 gap-3">
											{capabilities.map((capability, index) => (
												<motion.div
													key={index}
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: 0.7 + index * 0.1 }}
													whileHover={{
														y: -4,
														transition: { type: "spring", stiffness: 400 },
													}}
												>
													<Card
														className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
														isPressable
													>
														<CardBody className="p-4">
															<div className="flex items-start gap-3">
																<div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
																	{capability.icon}
																</div>
																<div className="flex-1">
																	<h3 className="font-semibold text-sm text-foreground">
																		{capability.title}
																	</h3>
																	<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
																		{capability.description}
																	</p>
																</div>
															</div>
														</CardBody>
													</Card>
												</motion.div>
											))}
										</div>
									</motion.div>

									{/* Getting Started */}
									<motion.div
										className="text-center"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 1.2 }}
									>
										<Chip
											variant="flat"
											color="primary"
											size="sm"
											className="text-xs"
										>
											💡 Try asking: &quot;What events do I have coming
											up?&quot;
										</Chip>
									</motion.div>
								</motion.div>
							) : (
								<>
									{/* Messages */}
									<div className="space-y-4">
										<AnimatePresence>
											{messages.map((message) => (
												<motion.div
													key={message.id}
													className={`flex gap-3 ${
														message.role === "user"
															? "flex-row-reverse"
															: "flex-row"
													}`}
													initial={{ opacity: 0, y: 20, scale: 0.95 }}
													animate={{ opacity: 1, y: 0, scale: 1 }}
													transition={{
														type: "spring",
														stiffness: 300,
														damping: 25,
													}}
												>
													{/* Avatar */}
													<Avatar
														src=""
														icon={
															message.role === "user" ? (
																<User className="h-4 w-4" />
															) : (
																<Bot className="h-4 w-4" />
															)
														}
														className={
															message.role === "user"
																? "bg-primary"
																: "bg-gradient-to-br from-secondary to-primary"
														}
														size="sm"
													/>

													{/* Message Bubble */}
													<div
														className={`flex-1 max-w-[75%] ${
															message.role === "user"
																? "text-right"
																: "text-left"
														}`}
													>
														<Card
															className={`inline-block ${
																message.role === "user"
																	? "bg-primary text-primary-foreground ml-auto"
																	: "bg-default-100 border-divider/50"
															}`}
														>
															<CardBody className="px-4 py-3">
																{message.role === "user" ? (
																	<p className="text-sm whitespace-pre-wrap">
																		{message.content}
																	</p>
																) : (
																	<div className="prose prose-sm dark:prose-invert max-w-none">
																		<ReactMarkdown>
																			{message.content}
																		</ReactMarkdown>
																	</div>
																)}
															</CardBody>
														</Card>

														{/* Timestamp */}
														<p
															className={`text-xs text-muted-foreground mt-1 ${
																message.role === "user"
																	? "text-right"
																	: "text-left"
															}`}
														>
															{new Date().toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})}
														</p>
													</div>
												</motion.div>
											))}
										</AnimatePresence>
									</div>
									<div ref={messagesEndRef} />
								</>
							)}
						</div>
					</ScrollShadow>
				</CardBody>

				{/* Modern Input Section */}
				<div className="border-t border-divider/50 bg-background/60 backdrop-blur-sm p-4">
					<motion.form
						onSubmit={handleFormSubmit}
						className="flex gap-3 items-end"
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						<div className="flex-1">
							<Input
								value={input}
								onChange={handleInputChange}
								placeholder="Type your message..."
								variant="bordered"
								size="lg"
								radius="lg"
								disabled={status === "submitted"}
								classNames={{
									base: "w-full",
									mainWrapper: "h-14",
									input: "text-sm",
									inputWrapper:
										"h-14 border-divider hover:border-primary/50 data-[focus=true]:border-primary data-[hover=true]:border-primary/50 group-data-[focus=true]:border-primary",
								}}
							/>
						</div>

						<Button
							type="submit"
							color="primary"
							isIconOnly
							size="lg"
							radius="lg"
							isDisabled={!input.trim() || status === "submitted"}
							className="h-14 w-14 shadow-lg"
							isLoading={status === "submitted"}
						>
							{status === "submitted" ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<Send className="h-5 w-5" />
							)}
						</Button>
					</motion.form>

					{/* Quick Actions */}
					<div className="flex gap-2 mt-3 flex-wrap">
						{messages.length === 0 && (
							<>
								<Chip
									size="sm"
									variant="flat"
									className="cursor-pointer hover:bg-primary/10 transition-colors"
									onClick={() => {
										handleInputChange({
											target: { value: "What events do I have coming up?" },
										} as React.ChangeEvent<HTMLInputElement>);
									}}
								>
									📅 Upcoming events
								</Chip>
								<Chip
									size="sm"
									variant="flat"
									className="cursor-pointer hover:bg-primary/10 transition-colors"
									onClick={() => {
										handleInputChange({
											target: { value: "Show me my contacts" },
										} as React.ChangeEvent<HTMLInputElement>);
									}}
								>
									👥 My contacts
								</Chip>
								<Chip
									size="sm"
									variant="flat"
									className="cursor-pointer hover:bg-primary/10 transition-colors"
									onClick={() => {
										handleInputChange({
											target: { value: "Help me create an event" },
										} as React.ChangeEvent<HTMLInputElement>);
									}}
								>
									✨ Create event
								</Chip>
							</>
						)}
					</div>
				</div>
			</Card>
		</div>
	);
}
