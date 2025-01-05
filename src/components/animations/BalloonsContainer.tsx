"use client";

import React, { useLayoutEffect, useState } from "react";
import Balloon from "./Balloon";
import "./balloons.css";

// Predefined balloon colors
const balloonColors = [
	"#FF6B6B", // Red
	"#FFD93D", // Yellow
	"#6BCB77", // Green
	"#4D96FF", // Blue
	"#C77DFF", // Purple
	"#FF9F1C", // Orange
	"#FF6EC7", // Pink
];

interface BalloonsContainerProps {
	isPreview?: boolean;
}

const BalloonsContainer: React.FC<BalloonsContainerProps> = ({
	isPreview = false,
}) => {
	const [isMounted, setIsMounted] = useState(false);

	useLayoutEffect(() => {
		// Set mounted state after initial render
		setIsMounted(true);
		return () => setIsMounted(false);
	}, []);

	// Create 10 balloons with fixed positions
	const balloons = Array.from({ length: 10 }).map((_, index) => ({
		color: balloonColors[index % balloonColors.length],
		index,
	}));

	return (
		<div
			className={`balloons-container ${isPreview ? "preview" : ""} ${
				isMounted ? "loaded" : ""
			}`}
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				minHeight: isPreview ? "180px" : "100vh",
			}}
		>
			{balloons.map((balloon) => (
				<Balloon
					key={balloon.index}
					color={balloon.color}
					index={balloon.index}
				/>
			))}
		</div>
	);
};

export default BalloonsContainer;
