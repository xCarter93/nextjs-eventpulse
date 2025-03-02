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
		<div className="absolute right-0 translate-x-full top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
			<button
				onClick={onEdit}
				className="p-2 bg-primary/20 dark:bg-primary/30 hover:bg-primary/30 dark:hover:bg-primary/40 text-primary dark:text-primary rounded-lg transition-colors flex flex-col items-center shadow-sm border border-primary/20"
				title="Edit component"
			>
				<Pencil className="h-4 w-4" />
				<span className="text-[10px] font-medium mt-1">Edit</span>
			</button>
			<button
				onClick={onDelete}
				className="p-2 bg-destructive/20 dark:bg-destructive/30 hover:bg-destructive/30 dark:hover:bg-destructive/40 text-destructive dark:text-destructive rounded-lg transition-colors flex flex-col items-center shadow-sm border border-destructive/20"
				title="Delete component"
			>
				<Trash2 className="h-4 w-4" />
				<span className="text-[10px] font-medium mt-1">Delete</span>
			</button>
		</div>
	);
}
