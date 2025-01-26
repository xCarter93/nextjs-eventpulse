"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SuccessPage() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to dashboard after 3 seconds
		const timeout = setTimeout(() => {
			router.push("/dashboard");
		}, 3000);

		return () => clearTimeout(timeout);
	}, [router]);

	return (
		<div className="h-screen flex flex-col items-center justify-center bg-background">
			<div className="flex items-center gap-6">
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{
						type: "spring",
						stiffness: 260,
						damping: 20,
					}}
					className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center shrink-0"
				>
					<motion.svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={3}
						stroke="currentColor"
						className="w-8 h-8 text-green-500"
						initial={{ pathLength: 0 }}
						animate={{ pathLength: 1 }}
						transition={{
							delay: 0.2,
							duration: 0.8,
							ease: "easeInOut",
						}}
					>
						<motion.path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M4.5 12.75l6 6 9-13.5"
						/>
					</motion.svg>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.5 }}
					className="text-left"
				>
					<h1 className="text-2xl font-bold">Payment Successful!</h1>
					<p className="text-muted-foreground mt-2">
						Redirecting you to your dashboard...
					</p>
				</motion.div>
			</div>
		</div>
	);
}
