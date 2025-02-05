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
import {
	type EmailComponent,
	type EventComponent,
} from "@/types/email-components";
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
import { Calendar } from "lucide-react";

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
	const events = useQuery(api.events.getEvents);
	const recipients = useQuery(api.recipients.getRecipients);

	// Filter upcoming events (custom events and birthdays)
	const upcomingEvents = [
		...(events || []).map((event) => ({
			id: event._id,
			type: "custom" as const,
			title: event.name,
			date: event.date,
		})),
		...(recipients || []).map((recipient) => {
			// For birthdays, we need to check if the month and day haven't occurred this year
			const birthday = new Date(recipient.birthday);
			const today = new Date();
			const thisYearBirthday = new Date(
				today.getFullYear(),
				birthday.getMonth(),
				birthday.getDate()
			);

			// If this year's birthday has passed, use next year's date
			if (thisYearBirthday < today) {
				thisYearBirthday.setFullYear(today.getFullYear() + 1);
			}

			return {
				id: recipient._id,
				type: "birthday" as const,
				title: `${recipient.name}'s Birthday`,
				date: thisYearBirthday.getTime(),
			};
		}),
	]
		.filter((event) => {
			if (event.type === "custom") {
				return event.date > Date.now(); // Filter out past custom events
			}
			return true; // Keep all birthdays since we've already adjusted their dates
		})
		.sort((a, b) => a.date - b.date);

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

			case "event":
				const eventComponent = editedComponent as EventComponent;
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Event Type</Label>
							<Select
								value={eventComponent.eventType}
								onValueChange={(value: "birthday" | "custom") =>
									setEditedComponent({
										...eventComponent,
										eventType: value,
										eventId: undefined, // Reset selection when changing type
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Choose event type..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="birthday">Birthday</SelectItem>
									<SelectItem value="custom">Custom Event</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Select Event</Label>
							<Select
								value={eventComponent.eventId}
								onValueChange={(value) => {
									const selectedEvent = upcomingEvents.find(
										(e) => e.id === value
									);
									if (selectedEvent) {
										setEditedComponent({
											...eventComponent,
											eventId: value,
											eventType: selectedEvent.type,
											placeholderTitle: selectedEvent.title,
											placeholderDate: selectedEvent.date,
										});
									}
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Choose an event..." />
								</SelectTrigger>
								<SelectContent>
									{upcomingEvents
										.filter(
											(event) =>
												!eventComponent.eventType ||
												event.type === eventComponent.eventType
										)
										.map((event) => (
											<SelectItem key={event.id} value={event.id}>
												<div className="flex items-center gap-2">
													<Calendar className="h-4 w-4" />
													<span>{event.title}</span>
													<span className="text-muted-foreground">
														{new Date(event.date).toLocaleDateString()}
													</span>
												</div>
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						{eventComponent.eventId && (
							<div className="mt-4 p-4 rounded-lg border">
								<div className="flex items-center gap-2">
									<Calendar className="h-5 w-5 text-primary" />
									<div>
										<p className="font-medium">
											{eventComponent.placeholderTitle}
										</p>
										<p className="text-sm text-muted-foreground">
											{new Date(
												eventComponent.placeholderDate
											).toLocaleDateString(undefined, {
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</p>
									</div>
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
