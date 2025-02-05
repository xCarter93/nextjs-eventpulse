"use client";

import { type ColorScheme } from "@/types";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type EmailComponent } from "@/types/email-components";
import { GripVertical } from "lucide-react";
import { ComponentControls } from "./ComponentControls";
import { ComponentConfigDialog } from "./ComponentConfigDialog";
import { useState } from "react";
import Image from "next/image";
import { Calendar } from "lucide-react";

interface EmailPreviewProps {
	colorScheme?: ColorScheme;
	components: EmailComponent[];
	onUpdateComponent?: (id: string, updatedComponent: EmailComponent) => void;
	onDeleteComponent?: (id: string) => void;
}

interface SortableComponentProps {
	component: EmailComponent;
	colorScheme?: ColorScheme;
	onUpdate?: (updatedComponent: EmailComponent) => void;
	onDelete?: () => void;
}

function DropZone({ isOver, id }: { isOver: boolean; id: string }) {
	const { setNodeRef, isOver: isOverCurrent } = useDroppable({
		id,
		data: {
			accepts: ["heading", "text", "button", "image"],
		},
	});

	return (
		<div
			ref={setNodeRef}
			className={`w-full h-4 my-2 rounded-lg transition-all duration-200 ${
				isOver && isOverCurrent
					? "h-24 bg-primary/10 border-2 border-dashed border-primary"
					: "border-2 border-transparent hover:border-muted"
			}`}
		>
			{isOver && isOverCurrent && (
				<div className="flex items-center justify-center h-full">
					<p className="text-sm text-primary">Drop component here</p>
				</div>
			)}
		</div>
	);
}

function SortableComponent({
	component,
	colorScheme,
	onUpdate,
	onDelete,
}: SortableComponentProps) {
	const [isEditing, setIsEditing] = useState(false);
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: component.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : undefined,
		backgroundColor: colorScheme?.background || "#F3F4F6",
	};

	const handleEdit = () => setIsEditing(true);
	const handleDelete = () => onDelete?.();
	const handleSave = (updatedComponent: EmailComponent) =>
		onUpdate?.(updatedComponent);

	return (
		<>
			<div
				ref={setNodeRef}
				style={style}
				className="group relative w-full hover:bg-accent/5 rounded-lg py-2 px-4 -my-2 transition-colors"
			>
				<div
					{...attributes}
					{...listeners}
					className="absolute left-4 inset-y-0 flex items-center opacity-0 group-hover:opacity-100 cursor-grab transition-opacity"
				>
					<div className="p-2 hover:bg-accent rounded-md">
						<GripVertical className="h-4 w-4 text-muted-foreground" />
					</div>
				</div>
				<div className="pl-8 pr-12">
					<EmailComponentRenderer
						component={component}
						colorScheme={colorScheme}
					/>
				</div>
				<ComponentControls onEdit={handleEdit} onDelete={handleDelete} />
			</div>
			<ComponentConfigDialog
				component={component}
				open={isEditing}
				onOpenChange={setIsEditing}
				onSave={handleSave}
			/>
		</>
	);
}

function EmailComponentRenderer({
	component,
	colorScheme,
}: {
	component: EmailComponent;
	colorScheme?: ColorScheme;
}) {
	const style = {
		color: colorScheme?.primary || "#484848",
	};

	const handleButtonClick = (e: React.MouseEvent) => {
		e.preventDefault();
	};

	switch (component.type) {
		case "heading":
			return (
				<h2
					className="text-3xl font-bold leading-[1.3] text-center w-full"
					style={style}
				>
					{component.content}
				</h2>
			);
		case "text":
			return (
				<p className="text-lg leading-[1.6] text-center w-full" style={style}>
					{component.content}
				</p>
			);
		case "button":
			return (
				<div className="text-center">
					<a
						href="#"
						onClick={handleButtonClick}
						className="inline-block px-6 py-3 rounded-lg font-medium text-white transition-colors pointer-events-none"
						style={{ backgroundColor: colorScheme?.accent || "#3B82F6" }}
					>
						{component.content}
					</a>
				</div>
			);
		case "image":
			return component.url ? (
				<div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
					<Image
						src={component.url}
						alt={component.alt}
						fill
						className="object-cover rounded-lg"
					/>
				</div>
			) : (
				<div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
					Add image URL
				</div>
			);
		case "event":
			return (
				<table
					align="center"
					width="100%"
					cellPadding="0"
					cellSpacing="0"
					role="presentation"
				>
					<tbody style={{ width: "100%" }}>
						<tr style={{ width: "100%" }}>
							<td
								data-id="__react-email-column"
								style={{
									verticalAlign: "middle",
									paddingRight: "24px",
									width: "48px",
								}}
							>
								<div className="w-12 h-12 flex items-center justify-center">
									<Calendar
										className="h-12 w-12 text-primary"
										style={{ color: colorScheme?.accent || "#3B82F6" }}
									/>
								</div>
							</td>
							<td
								data-id="__react-email-column"
								style={{ verticalAlign: "middle" }}
							>
								<p
									style={{
										fontSize: "20px",
										lineHeight: "28px",
										margin: "0px",
										fontWeight: 600,
										color: colorScheme?.primary || "rgb(17,24,39)",
									}}
								>
									{component.eventId
										? "Event Title" // TODO: Fetch actual event title
										: component.placeholderTitle}
								</p>
								<p
									style={{
										fontSize: "16px",
										lineHeight: "24px",
										margin: "0px",
										marginTop: "8px",
										color: colorScheme?.secondary || "rgb(107,114,128)",
									}}
								>
									{new Date(
										component.eventId
											? component.placeholderDate // Use placeholder date until we implement event fetching
											: component.placeholderDate
									).toLocaleDateString(undefined, {
										weekday: "long",
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							</td>
						</tr>
					</tbody>
				</table>
			);
	}
}

export function EmailPreview({
	colorScheme,
	components,
	onUpdateComponent,
	onDeleteComponent,
}: EmailPreviewProps) {
	const previewStyle = {
		backgroundColor: colorScheme?.background || "#F3F4F6",
	};

	const footerStyle = {
		borderColor: colorScheme?.accent || "#eaeaea",
		color: colorScheme?.secondary || "#666666",
	};

	return (
		<div
			className="flex flex-col items-center gap-4 p-6 font-sans max-w-[600px] mx-auto rounded-lg bg-card"
			style={previewStyle}
		>
			<div className="w-full min-h-[200px] flex flex-col items-stretch">
				<DropZone isOver={true} id="drop-zone-0" />
				{components.map((component, index) => (
					<div key={component.id}>
						<SortableComponent
							component={component}
							colorScheme={colorScheme}
							onUpdate={
								onUpdateComponent
									? (updated) => onUpdateComponent(component.id, updated)
									: undefined
							}
							onDelete={
								onDeleteComponent
									? () => onDeleteComponent(component.id)
									: undefined
							}
						/>
						<DropZone isOver={true} id={`drop-zone-${index + 1}`} />
					</div>
				))}
				{components.length === 0 && (
					<p className="text-muted-foreground text-center my-8">
						Drag components here to build your email
					</p>
				)}
			</div>

			<div
				className="w-full text-center text-sm mt-4 pt-4 border-t"
				style={footerStyle}
			>
				<p className="text-sm mt-2" style={footerStyle}>
					Sent with ❤️ from{" "}
					<a
						href="https://eventpulse.com"
						className="hover:text-blue-800"
						style={{ color: colorScheme?.primary || "#3B82F6" }}
					>
						EventPulse
					</a>
				</p>
			</div>
		</div>
	);
}
