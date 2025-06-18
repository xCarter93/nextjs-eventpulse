"use client";

import {
	Card,
	CardHeader,
	CardBody,
	Progress,
	CircularProgress,
} from "@heroui/react";
import { Mail, Eye, MousePointer, BarChart3 } from "lucide-react";

export function PerformanceMetricsWidget() {
	// TODO: Replace with real data from backend analytics
	const metrics = {
		deliveryRate: 94.5,
		openRate: 68.2,
		clickRate: 12.8,
		totalEmailsSent: 1247,
		deliveryTrend: "+2.4%",
		openTrend: "+5.1%",
		clickTrend: "-0.8%",
	};

	const performanceScore = Math.round(
		(metrics.deliveryRate + metrics.openRate + metrics.clickRate) / 3
	);

	return (
		<Card className="h-[300px]">
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5 text-primary" />
					<h3 className="text-lg font-semibold">Performance</h3>
					<span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
						Placeholder Data
					</span>
				</div>
			</CardHeader>
			<CardBody className="pt-0">
				<div className="space-y-4">
					{/* Performance Score Circle */}
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<div className="text-sm text-muted-foreground mb-1">
								Overall Score
							</div>
							<div className="text-lg font-semibold">
								{performanceScore}/100
							</div>
						</div>
						<CircularProgress
							value={performanceScore}
							size="lg"
							color={
								performanceScore >= 80
									? "success"
									: performanceScore >= 60
										? "warning"
										: "danger"
							}
							showValueLabel={false}
							className="flex-shrink-0"
						/>
					</div>

					{/* Key Metrics */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="p-1.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/20">
									<Mail className="h-3 w-3" />
								</div>
								<div>
									<div className="text-sm font-medium">Delivery Rate</div>
									<div className="text-xs text-muted-foreground">
										{metrics.deliveryTrend} vs last month
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-sm font-semibold">
									{metrics.deliveryRate}%
								</div>
								<Progress
									value={metrics.deliveryRate}
									size="sm"
									color="success"
									className="w-16"
								/>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="p-1.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20">
									<Eye className="h-3 w-3" />
								</div>
								<div>
									<div className="text-sm font-medium">Open Rate</div>
									<div className="text-xs text-muted-foreground">
										{metrics.openTrend} vs last month
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-sm font-semibold">{metrics.openRate}%</div>
								<Progress
									value={metrics.openRate}
									size="sm"
									color="primary"
									className="w-16"
								/>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="p-1.5 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20">
									<MousePointer className="h-3 w-3" />
								</div>
								<div>
									<div className="text-sm font-medium">Click Rate</div>
									<div className="text-xs text-muted-foreground">
										{metrics.clickTrend} vs last month
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-sm font-semibold">
									{metrics.clickRate}%
								</div>
								<Progress
									value={metrics.clickRate}
									size="sm"
									color="secondary"
									className="w-16"
								/>
							</div>
						</div>
					</div>

					{/* Total Emails Sent */}
					<div className="pt-2 border-t border-gray-200 dark:border-gray-700">
						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								Total Emails Sent
							</div>
							<div className="text-sm font-semibold">
								{metrics.totalEmailsSent.toLocaleString()}
							</div>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
}

/* TODO: Backend implementation needed for real metrics
 * 1. Track email delivery status in scheduledEmails table
 * 2. Add email_events table to track opens, clicks, bounces
 * 3. Create analytics queries in Convex:
 *    - getEmailDeliveryStats
 *    - getEmailEngagementStats
 *    - getPerformanceTrends
 * 4. Add email tracking pixels and click tracking
 * 5. Implement webhook handlers for email service providers
 */
