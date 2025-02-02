"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type EmailComponent } from "@/types/email-components";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface ComponentConfigDialogProps {
	component: EmailComponent;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (updatedComponent: EmailComponent) => void;
}

export function ComponentConfigDialog({
	component,
	open,
	onOpenChange,
	onSave,
}: ComponentConfigDialogProps) {
	const [editedComponent, setEditedComponent] =
		useState<EmailComponent>(component);
	const userAnimations = useQuery(api.animations.getUserAnimations);

	const handleSave = () => {
		onSave(editedComponent);
		onOpenChange(false);
	};

	const renderFields = () => {
		switch (editedComponent.type) {
			case "heading":
			case "text":
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Content</Label>
							<Textarea
								value={editedComponent.content}
								onChange={(e) =>
									setEditedComponent({
										...editedComponent,
										content: e.target.value,
									})
								}
								placeholder={`Enter ${editedComponent.type} content...`}
							/>
						</div>
					</div>
				);

			case "button":
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Button Text</Label>
							<Input
								value={editedComponent.content}
								onChange={(e) =>
									setEditedComponent({
										...editedComponent,
										content: e.target.value,
									})
								}
								placeholder="Enter button text..."
							/>
						</div>
						<div className="space-y-2">
							<Label>URL</Label>
							<Input
								value={editedComponent.url}
								onChange={(e) =>
									setEditedComponent({
										...editedComponent,
										url: e.target.value,
									})
								}
								placeholder="Enter button URL..."
							/>
						</div>
					</div>
				);

			case "image":
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Select Image</Label>
							<Select
								value={editedComponent.url}
								onValueChange={(value) =>
									setEditedComponent({
										...editedComponent,
										url: value,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Choose an image..." />
								</SelectTrigger>
								<SelectContent>
									{userAnimations?.map((animation) => (
										<SelectItem key={animation._id} value={animation.url || ""}>
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 relative rounded overflow-hidden">
													<Image
														src={animation.url || ""}
														alt={animation.name || ""}
														fill
														className="object-cover"
													/>
												</div>
												<span>{animation.name || "Untitled"}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Alt Text</Label>
							<Input
								value={editedComponent.alt}
								onChange={(e) =>
									setEditedComponent({
										...editedComponent,
										alt: e.target.value,
									})
								}
								placeholder="Enter image description..."
							/>
						</div>
						{editedComponent.url && (
							<div className="mt-4">
								<div className="aspect-video relative rounded-lg overflow-hidden">
									<Image
										src={editedComponent.url}
										alt={editedComponent.alt}
										fill
										className="object-cover"
									/>
								</div>
							</div>
						)}
					</div>
				);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Edit{" "}
						{editedComponent.type.charAt(0).toUpperCase() +
							editedComponent.type.slice(1)}
					</DialogTitle>
				</DialogHeader>
				<div className="py-4">{renderFields()}</div>
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save Changes</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
