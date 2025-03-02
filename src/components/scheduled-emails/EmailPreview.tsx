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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Mic, Calendar, SeparatorHorizontal } from "lucide-react";

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
			accepts: [
				"heading",
				"text",
				"button",
				"image",
				"event",
				"divider",
				"audio",
			],
		},
	});

	return (
		<div
			ref={setNodeRef}
			className={`w-full my-2 rounded-lg transition-all duration-200 border-2 border-dashed ${
				isOver && isOverCurrent
					? "h-24 border-primary bg-primary/10"
					: "h-12 border-muted hover:border-primary/50 hover:bg-muted/5"
			}`}
		>
			<div className="flex items-center justify-center h-full">
				<p
					className={`text-sm ${
						isOver && isOverCurrent
							? "text-primary font-medium"
							: "text-muted-foreground"
					}`}
				>
					{isOver && isOverCurrent
						? "Drop component here"
						: "Drag components here"}
				</p>
			</div>
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

	const handleInlineUpdate = (updatedComponent: EmailComponent) => {
		onUpdate?.(updatedComponent);
	};

	return (
		<>
			<div
				ref={setNodeRef}
				style={style}
				className="group relative w-full hover:bg-accent/5 rounded-lg py-3 px-6 -my-2 transition-colors"
			>
				<div
					{...attributes}
					{...listeners}
					className="absolute left-0 -translate-x-full inset-y-0 flex items-center opacity-0 group-hover:opacity-100 cursor-grab transition-opacity"
				>
					<div
						className="p-2 bg-primary/20 dark:bg-primary/30 hover:bg-primary/30 dark:hover:bg-primary/40 rounded-md flex flex-col items-center shadow-sm border border-primary/20"
						title="Drag to move component"
					>
						<GripVertical className="h-4 w-4 text-primary dark:text-primary" />
						<span className="text-[10px] font-medium text-primary dark:text-primary mt-1">
							Move
						</span>
					</div>
				</div>
				<div className="px-2">
					<EmailComponentRenderer
						component={component}
						colorScheme={colorScheme}
						onUpdate={handleInlineUpdate}
						onOpenConfigDialog={handleEdit}
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
	onUpdate,
	onOpenConfigDialog,
}: {
	component: EmailComponent;
	colorScheme?: ColorScheme;
	onUpdate?: (updatedComponent: EmailComponent) => void;
	onOpenConfigDialog?: () => void;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState("");

	const style = {
		color: colorScheme?.primary || "#484848",
	};

	const startEditing = (initialValue: string) => {
		setEditValue(initialValue);
		setIsEditing(true);
	};

	const saveEdit = () => {
		if (
			onUpdate &&
			(component.type === "heading" ||
				component.type === "text" ||
				component.type === "button")
		) {
			onUpdate({
				...component,
				content: editValue,
			});
		}
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			saveEdit();
		} else if (e.key === "Escape") {
			setIsEditing(false);
		}
	};

	const openConfigDialog = () => {
		if (onOpenConfigDialog) {
			onOpenConfigDialog();
		}
	};

	switch (component.type) {
		case "heading":
			return isEditing ? (
				<div className="w-full">
					<Input
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						onBlur={saveEdit}
						onKeyDown={handleKeyDown}
						className="text-2xl font-bold text-center w-full"
						autoFocus
						placeholder="Enter heading text..."
					/>
					<p className="text-xs text-center text-muted-foreground mt-1">
						Press Enter to save, Esc to cancel
					</p>
				</div>
			) : (
				<h2
					className="text-3xl font-bold leading-[1.3] text-center w-full cursor-text"
					style={style}
					onClick={() => startEditing(component.content)}
				>
					{component.content || (
						<span className="text-muted-foreground">Click to add heading</span>
					)}
				</h2>
			);
		case "text":
			return isEditing ? (
				<div className="w-full">
					<Textarea
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						onBlur={saveEdit}
						onKeyDown={handleKeyDown}
						className="text-lg text-center w-full min-h-[100px]"
						autoFocus
						placeholder="Enter text content..."
					/>
					<p className="text-xs text-center text-muted-foreground mt-1">
						Press Enter to save, Esc to cancel
					</p>
				</div>
			) : (
				<p
					className="text-lg leading-[1.6] text-center w-full cursor-text"
					style={style}
					onClick={() => startEditing(component.content)}
				>
					{component.content || (
						<span className="text-muted-foreground">Click to add text</span>
					)}
				</p>
			);
		case "button":
			return isEditing ? (
				<div className="w-full text-center">
					<Input
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						onBlur={saveEdit}
						onKeyDown={handleKeyDown}
						className="text-center max-w-xs mx-auto"
						autoFocus
						placeholder="Enter button text..."
					/>
					<p className="text-xs text-center text-muted-foreground mt-1">
						Press Enter to save, Esc to cancel
					</p>
				</div>
			) : (
				<div className="text-center">
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault();
							startEditing(component.content);
						}}
						className="inline-block px-6 py-3 rounded-lg font-medium text-white transition-colors cursor-text"
						style={{ backgroundColor: colorScheme?.accent || "#3B82F6" }}
					>
						{component.content || "Click to edit button"}
					</a>
				</div>
			);
		case "image":
			return component.url ? (
				<div
					className="relative w-full aspect-[16/9] rounded-lg overflow-hidden group/image"
					onClick={openConfigDialog}
				>
					<Image
						src={component.url}
						alt={component.alt}
						fill
						className="object-cover rounded-lg"
					/>
					{onUpdate && (
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 flex items-center justify-center transition-opacity">
							<Button variant="secondary" size="sm" className="font-medium">
								Change Image
							</Button>
						</div>
					)}
				</div>
			) : (
				<div
					className="w-full aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2 p-4 cursor-pointer"
					onClick={openConfigDialog}
				>
					<ImageIcon className="h-10 w-10 text-muted-foreground" />
					<p className="text-muted-foreground text-center">
						Click to add an image
					</p>
					{onUpdate && (
						<Button variant="secondary" size="sm" className="mt-2">
							Upload Image
						</Button>
					)}
				</div>
			);
		case "event":
			return (
				<div className="relative">
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
										<span
											style={{
												fontSize: "48px",
												lineHeight: 1,
												display: "block",
											}}
										>
											🗓️
										</span>
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
											? component.placeholderTitle
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
												? component.placeholderDate
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
					{onUpdate && !component.eventId && (
						<div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center">
							<Button
								variant="secondary"
								size="sm"
								className="font-medium"
								onClick={openConfigDialog}
							>
								<Calendar className="h-4 w-4 mr-2" />
								Select Event
							</Button>
						</div>
					)}
				</div>
			);
		case "divider":
			return (
				<div className="relative">
					<hr
						className="w-full my-4"
						style={{ borderColor: colorScheme?.accent || "#E5E7EB" }}
					/>
					{onUpdate && (
						<div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
							<Button
								variant="ghost"
								size="sm"
								className="font-medium bg-background/80"
								onClick={openConfigDialog}
							>
								<SeparatorHorizontal className="h-4 w-4 mr-2" />
								Edit Divider
							</Button>
						</div>
					)}
				</div>
			);
		case "audio":
			return (
				<div
					className="w-full p-3 border rounded-lg relative"
					style={{ borderColor: colorScheme?.accent || "#E5E7EB" }}
				>
					<div className="flex items-center gap-2">
						<span className="text-xl" role="img" aria-label="microphone">
							🎤
						</span>
						<p className="font-medium" style={style}>
							{component.title || "Audio Message"}
						</p>
					</div>
					{component.audioUrl ? (
						<audio
							controls
							className="mt-2 w-full h-10"
							src={component.audioUrl}
						>
							Your browser does not support the audio element.
						</audio>
					) : (
						<div className="mt-1">
							<p className="text-sm text-muted-foreground">
								{component.isRecorded
									? "Recording not saved"
									: "No audio uploaded"}
							</p>
							{onUpdate && (
								<Button
									variant="secondary"
									size="sm"
									className="mt-2"
									onClick={openConfigDialog}
								>
									<Mic className="h-4 w-4 mr-2" />
									{component.isRecorded ? "Record Audio" : "Upload Audio"}
								</Button>
							)}
						</div>
					)}
				</div>
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
