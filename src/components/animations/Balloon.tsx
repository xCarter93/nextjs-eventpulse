"use client";

import React from "react";
import "./balloons.css";

interface BalloonProps {
	color: string;
	index: number;
}

const Balloon: React.FC<BalloonProps> = ({ color, index }) => {
	const gradientId = `balloonGradient${index}`;
	const highlightId = `balloonHighlight${index}`;

	return (
		<div className={`balloon balloon--${index + 1}`}>
			<svg
				width="100%"
				height="100%"
				viewBox="0 0 100 150"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<radialGradient
						id={gradientId}
						cx="40%"
						cy="40%"
						r="50%"
						fx="40%"
						fy="40%"
					>
						<stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
						<stop offset="80%" stopColor={color} />
						<stop offset="100%" stopColor={color} stopOpacity="0.8" />
					</radialGradient>
					<radialGradient
						id={highlightId}
						cx="30%"
						cy="30%"
						r="20%"
						fx="30%"
						fy="30%"
					>
						<stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
						<stop offset="100%" stopColor="#fff" stopOpacity="0" />
					</radialGradient>
				</defs>
				{/* Balloon Shape */}
				<path
					d="M50 10 
						C70 10, 85 30, 85 50 
						C85 65, 75 85, 50 110 
						C25 85, 15 65, 15 50 
						C15 30, 30 10, 50 10 Z"
					fill={`url(#${gradientId})`}
					stroke="rgba(0,0,0,0.1)"
					strokeWidth="1"
				/>
				<path
					d="M50 10 
						C70 10, 85 30, 85 50 
						C85 65, 75 85, 50 110 
						C25 85, 15 65, 15 50 
						C15 30, 30 10, 50 10 Z"
					fill={`url(#${highlightId})`}
				/>
				{/* Balloon Knot */}
				<path
					d="M47 110 
						C50 113, 53 113, 56 110 
						C53 115, 47 115, 47 110"
					fill="rgba(0,0,0,0.2)"
				/>
				{/* Balloon String */}
				<path
					d="M51.5 115 
						Q52 125, 50 135 
						Q48 125, 48.5 115"
					fill="none"
					stroke="rgba(0,0,0,0.2)"
					strokeWidth="1"
					strokeLinecap="round"
				/>
			</svg>
		</div>
	);
};

export default Balloon;
