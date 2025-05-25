import { Loader2 } from "lucide-react";

interface ToolLoadingProps {
	toolName: string;
}

export function ToolLoading({ toolName }: ToolLoadingProps) {
	const getToolDisplayName = (name: string) => {
		switch (name) {
			case "createEvent":
				return "Creating event";
			case "createRecipient":
				return "Adding contact";
			case "searchEvents":
				return "Searching events";
			case "searchRecipients":
				return "Searching contacts";
			default:
				return `Running ${name}`;
		}
	};

	return (
		<div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
			<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
			<span className="text-sm text-blue-700">
				{getToolDisplayName(toolName)}...
			</span>
		</div>
	);
}
