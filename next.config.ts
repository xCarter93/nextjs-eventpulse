import type { NextConfig } from "next";

const config: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "hallowed-perch-712.convex.cloud",
			},
			{
				protocol: "https",
				hostname: "media.giphy.com",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "upload.wikimedia.org",
			},
			{
				protocol: "https",
				hostname: "img.clerk.com",
			},
		],
	},
	env: {
		NEXT_PUBLIC_MAPBOX_API_KEY: process.env.MAPBOX_API_KEY,
	},
};

export default config;
