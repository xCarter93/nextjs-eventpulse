import { DashboardStats } from "./DashboardStats";

interface PageWithStatsProps {
	children: React.ReactNode;
}

export function PageWithStats({ children }: PageWithStatsProps) {
	return (
		<div className="container">
			<div className="flex flex-col lg:flex-row gap-6">
				<div className="flex-1">{children}</div>
				<div className="w-full lg:w-96 order-last">
					<DashboardStats />
				</div>
			</div>
		</div>
	);
}
