import Link from "next/link";

export function QuickActions() {
	return (
		<div className="bg-card p-6 rounded-lg shadow-sm">
			<h2 className="text-lg font-semibold mb-4 text-card-foreground">
				Quick Actions
			</h2>
			<div className="grid grid-cols-2 gap-4">
				<Link
					href="/recipients/new"
					className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
				>
					<span className="text-xl mb-2">👥</span>
					<span className="text-sm font-medium text-foreground">
						Add Recipient
					</span>
				</Link>
				<Link
					href="/animations/new"
					className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
				>
					<span className="text-xl mb-2">✨</span>
					<span className="text-sm font-medium text-foreground">
						Create Animation
					</span>
				</Link>
				<Link
					href="/settings"
					className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
				>
					<span className="text-xl mb-2">⚙️</span>
					<span className="text-sm font-medium text-foreground">Settings</span>
				</Link>
				<Link
					href="/upgrade"
					className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
				>
					<span className="text-xl mb-2">⭐</span>
					<span className="text-sm font-medium text-foreground">
						Upgrade Plan
					</span>
				</Link>
			</div>
		</div>
	);
}
