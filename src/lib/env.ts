/**
 * Edge-compatible environment variables
 * This file provides direct access to environment variables without using @t3-oss/env-nextjs
 * which is not compatible with the Edge runtime
 */

// Server-side environment variables
export const serverEnv = {
	CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT || "",
	CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
	CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET || "",
	RESEND_API_KEY: process.env.RESEND_API_KEY || "",
	MAPBOX_API_KEY: process.env.MAPBOX_API_KEY || "",
	STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
	STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
	GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
	GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
	GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI || "",
	GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
	OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
};

// Client-side environment variables
export const clientEnv = {
	NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || "",
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
	NEXT_PUBLIC_CLERK_HOSTNAME: process.env.NEXT_PUBLIC_CLERK_HOSTNAME || "",
	NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
		process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
	NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY:
		process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || "",
	NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL:
		process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL || "",
	NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "",
	NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "",
	NEXT_PUBLIC_CLERK_SIGN_IN_URL:
		process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "",
	NEXT_PUBLIC_CLERK_SIGN_UP_URL:
		process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "",
	NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || "",
	NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || "",
};

// Combined environment variables for convenience
export const env = {
	...serverEnv,
	...clientEnv,
};
