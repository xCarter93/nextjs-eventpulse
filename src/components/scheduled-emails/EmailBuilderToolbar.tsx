import { useDraggable } from "@dnd-kit/core";
import {
	Text,
	Heading,
	Square,
	Image,
	Calendar,
	MinusSquare,
} from "lucide-react";

interface ToolbarItemProps {
	id: string;
	icon: React.ReactNode;
	label: string;
}

function ToolbarItem({ id, icon, label }: ToolbarItemProps) {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: id,
	});

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
			}
		: undefined;

	return (
		<div
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			className="w-10 h-10 flex items-center justify-center cursor-move bg-background hover:bg-accent rounded-lg transition-colors"
			style={style}
			title={label}
		>
			<div className="text-muted-foreground">{icon}</div>
		</div>
	);
}

export function EmailBuilderToolbar() {
	const items = [
		{ id: "heading", icon: <Heading className="h-5 w-5" />, label: "Heading" },
		{ id: "text", icon: <Text className="h-5 w-5" />, label: "Text" },
		{ id: "button", icon: <Square className="h-5 w-5" />, label: "Button" },
		{
			id: "image",
			icon: <Image className="h-5 w-5" aria-label="Image component" />,
			label: "Image",
		},
		{
			id: "event",
			icon: <Calendar className="h-5 w-5" aria-label="Event component" />,
			label: "Event",
		},
		{
			id: "divider",
			icon: <MinusSquare className="h-5 w-5" aria-label="Divider component" />,
			label: "Divider",
		},
	];

	return (
		<div className="w-fit h-fit flex flex-col gap-2 p-2 border rounded-lg bg-card sticky top-6">
			{items.map((item) => (
				<ToolbarItem key={item.id} {...item} />
			))}
		</div>
	);
}
