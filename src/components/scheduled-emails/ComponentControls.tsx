"use client";

import { Pencil, Trash2 } from "lucide-react";

interface ComponentControlsProps {
	onEdit: () => void;
	onDelete: () => void;
}

export function ComponentControls({
	onEdit,
	onDelete,
}: ComponentControlsProps) {
	return (
		<div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 pl-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
			<button
				onClick={onEdit}
				className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-accent transition-colors"
				title="Edit"
			>
				<Pencil className="h-4 w-4" />
			</button>
			<button
				onClick={onDelete}
				className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-accent transition-colors"
				title="Delete"
			>
				<Trash2 className="h-4 w-4" />
			</button>
		</div>
	);
}
