import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		API_NINJA_API_KEY: z.string().min(1),
		CONVEX_DEPLOYMENT: z.string().min(1),
		CLERK_SECRET_KEY: z.string().min(1),
		CLERK_WEBHOOK_SECRET: z.string().min(1),
		RESEND_API_KEY: z.string().min(1),
		MAPBOX_API_KEY: z.string().min(1),
		STRIPE_SECRET_KEY: z.string().min(1),
		STRIPE_WEBHOOK_SECRET: z.string().min(1),
	},
	client: {
		NEXT_PUBLIC_CONVEX_URL: z.string().min(1),
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
		NEXT_PUBLIC_CLERK_HOSTNAME: z.string().min(1),
		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
		NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY: z.string().min(1),
		NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL: z.string().min(1),
		NEXT_PUBLIC_BASE_URL: z.string().min(1).url(),
		NEXT_PUBLIC_MAPBOX_API_KEY: z.string().min(1),
	},
	experimental__runtimeEnv: {
		NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
		NEXT_PUBLIC_CLERK_HOSTNAME: process.env.NEXT_PUBLIC_CLERK_HOSTNAME,
		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
		NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY:
			process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
		NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL:
			process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL,
		NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
		NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY,
	},
});
