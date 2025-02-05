"use client";

import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EmailBuilderToolbar } from "./EmailBuilderToolbar";
import { EmailPreview } from "./EmailPreview";
import { type ColorScheme } from "@/types";
import { useState, useEffect } from "react";
import {
	type EmailComponent,
	type EmailComponentType,
} from "@/types/email-components";

interface EmailBuilderProps {
	colorScheme?: ColorScheme;
	components?: EmailComponent[];
	onComponentsChange?: (components: EmailComponent[]) => void;
}

export function EmailBuilder({
	colorScheme,
	components: externalComponents,
	onComponentsChange,
}: EmailBuilderProps) {
	const [components, setComponents] = useState<EmailComponent[]>(
		externalComponents || []
	);

	// Update internal state when external components change
	useEffect(() => {
		setComponents(externalComponents || []);
	}, [externalComponents]);

	const createComponent = (type: EmailComponentType): EmailComponent => {
		const id = `${type}-${Date.now()}`;
		switch (type) {
			case "heading":
				return { id, type, content: "New Heading" };
			case "text":
				return { id, type, content: "New text block" };
			case "button":
				return { id, type, content: "Click me", url: "#" };
			case "image":
				return { id, type, url: "", alt: "Image description" };
			case "event":
				return {
					id,
					type,
					eventType: "custom",
					placeholderTitle: "Sample Event",
					placeholderDate: Date.now(),
				};
			case "divider":
				return { id, type };
		}
	};

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		// Only track active id for existing components
		if (components.find((c) => c.id === active.id)) {
			// Set active id in the sortable context
			return;
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { over, active } = event;

		if (!over) {
			return;
		}

		// Extract drop zone index from the id
		const dropZoneMatch = over.id.toString().match(/^drop-zone-(\d+)$/);
		const dropIndex = dropZoneMatch ? parseInt(dropZoneMatch[1]) : -1;

		if (dropIndex !== -1) {
			// Handle new component drops at specific positions
			const type = active.id as EmailComponentType;
			if (!components.find((c) => c.id === active.id)) {
				const newComponent = createComponent(type);
				const newComponents = [...components];
				newComponents.splice(dropIndex, 0, newComponent);
				setComponents(newComponents);
				onComponentsChange?.(newComponents);
				console.log("New component added to email:", {
					newComponent,
					allComponents: newComponents,
				});
			}
		} else {
			// Handle reordering
			const oldIndex = components.findIndex((c) => c.id === active.id);
			const newIndex = components.findIndex((c) => c.id === over.id);

			if (oldIndex !== -1 && newIndex !== -1) {
				const newComponents = arrayMove(components, oldIndex, newIndex);
				setComponents(newComponents);
				onComponentsChange?.(newComponents);
			}
		}
	};

	const handleUpdateComponent = (
		id: string,
		updatedComponent: EmailComponent
	) => {
		const newComponents = components.map((component) =>
			component.id === id ? updatedComponent : component
		);
		setComponents(newComponents);
		onComponentsChange?.(newComponents);
	};

	const handleDeleteComponent = (id: string) => {
		const newComponents = components.filter((component) => component.id !== id);
		setComponents(newComponents);
		onComponentsChange?.(newComponents);
	};

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div className="grid grid-cols-[auto_1fr] gap-4">
				<EmailBuilderToolbar />
				<div className="h-fit rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold mb-4">Email Preview</h2>
					<SortableContext
						items={components.map((c) => c.id)}
						strategy={verticalListSortingStrategy}
					>
						<EmailPreview
							colorScheme={colorScheme}
							components={components}
							onUpdateComponent={handleUpdateComponent}
							onDeleteComponent={handleDeleteComponent}
						/>
					</SortableContext>
				</div>
			</div>
		</DndContext>
	);
}
