import type { NextConfig } from "next";

const config: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "grateful-antelope-945.convex.cloud",
			},
			{
				protocol: "https",
				hostname: "media.giphy.com",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
		],
	},
};

export default config;
