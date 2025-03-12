"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { Button, Tooltip } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import ChatInterface from "./ChatInterface";

export function FloatingChatButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			{/* Floating Button with Pulse Animation */}
			<Tooltip content="Chat with AI Assistant" placement="left">
				<Button
					isIconOnly
					color="primary"
					className="fixed bottom-20 right-6 z-50 rounded-full shadow-lg lg:bottom-8 group"
					size="lg"
					onClick={() => setIsOpen(true)}
				>
					<Bot className="h-5 w-5" />
					{/* Pulse animation rings */}
					<span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping opacity-75"></span>
					<span className="absolute inset-0 rounded-full border border-primary/50 animate-pulse"></span>
				</Button>
			</Tooltip>

			{/* Chat Modal */}
			<Modal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				size="3xl"
				scrollBehavior="inside"
			>
				<ModalContent>
					<ModalHeader>
						<div className="flex items-center gap-2">
							<div className="p-1.5 rounded-lg bg-primary/10">
								<Bot className="h-5 w-5 text-primary" />
							</div>
							<h3 className="text-lg font-semibold">Chat Assistant</h3>
						</div>
					</ModalHeader>
					<ModalBody className="p-0">
						<ChatInterface />
					</ModalBody>
				</ModalContent>
			</Modal>
		</>
	);
}
