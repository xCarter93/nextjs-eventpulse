import type { NextConfig } from "next";

const config: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "grateful-antelope-945.convex.cloud",
			},
		],
	},
};

export default config;
