import { Alert } from "@heroui/alert";
import { TriangleAlert } from "lucide-react";
import { useFeatureFlagEnabled } from "posthog-js/react";

export const BetaBanner = () => {
	const betaFlagEnabled = useFeatureFlagEnabled("beta-banner");

	if (!betaFlagEnabled) return null;

	return (
		<div className="relative w-full bg-warning-100 rounded-full">
			<div
				className="absolute inset-0 rounded-full"
				style={{
					backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255, 166, 0, 0.1) 10px,
          rgba(255, 166, 0, 0.1) 20px
        )`,
				}}
			></div>
			<Alert
				className="max-w-7xl mx-auto relative z-10 py-1.5"
				color="warning"
				icon={<TriangleAlert className="h-5 w-5" />}
				variant="faded"
				radius="full"
			>
				<div className="flex flex-col sm:flex-row items-center justify-between gap-2">
					<div>
						<span className="font-semibold">Beta Version:</span> This site is
						currently in beta and subject to frequent updates.
					</div>
					<div>
						Have feedback? Contact us at{" "}
						<a
							href="mailto:pulse@eventpulse.tech"
							className="font-medium underline hover:text-warning-800"
						>
							pulse@eventpulse.tech
						</a>
					</div>
				</div>
			</Alert>
		</div>
	);
};
