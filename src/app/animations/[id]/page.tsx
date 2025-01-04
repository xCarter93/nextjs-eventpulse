import { type CustomAnimation } from "@/types";
import Link from "next/link";

// This would be fetched from your API based on the animation ID
const mockAnimation: CustomAnimation = {
	id: "1",
	templateId: "1",
	recipientId: "1",
	userId: "user1",
	customText:
		"Happy Birthday! 🎉 Wishing you a fantastic day filled with joy and laughter!",
	colorScheme: {
		primary: "#3B82F6",
		secondary: "#60A5FA",
		accent: "#F59E0B",
		background: "#F3F4F6",
	},
	createdAt: new Date(),
	url: "/animations/1",
};

export default function AnimationPreviewPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4">
			<div
				className="w-full max-w-4xl aspect-video rounded-lg shadow-lg relative overflow-hidden"
				style={{ backgroundColor: mockAnimation.colorScheme.background }}
			>
				{/* This is a placeholder for the actual animation */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="text-center space-y-4">
						<div
							className="text-4xl font-bold"
							style={{ color: mockAnimation.colorScheme.primary }}
						>
							{mockAnimation.customText}
						</div>
						<div
							className="text-lg"
							style={{ color: mockAnimation.colorScheme.secondary }}
						>
							Click to play animation
						</div>
					</div>
				</div>
			</div>

			<div className="mt-8 text-center">
				<p className="text-sm text-gray-500">Created with ❤️ using AnimGreet</p>
				<Link
					href="/"
					className="mt-4 inline-block text-blue-600 hover:text-blue-700"
				>
					Create your own animation →
				</Link>
			</div>
		</div>
	);
}
