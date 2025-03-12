import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/api/stripe-webhook",
	"/",
	"/privacy-policy",
	"/terms-of-service",
]);

// Configure the middleware for Edge compatibility
export const config = {
	matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
	runtime: "edge",
};

export default clerkMiddleware(async (auth, request) => {
	const { userId, redirectToSignIn } = await auth();
	if (!isPublicRoute(request) && !userId) {
		return redirectToSignIn();
	}
});
