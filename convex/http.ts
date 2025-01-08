import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
	path: "/clerk",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const payloadString = await request.text();
		const headerPayload = request.headers;

		try {
			const result = await ctx.runAction(internal.clerk.fulfill, {
				payload: payloadString,
				headers: {
					"svix-id": headerPayload.get("svix-id")!,
					"svix-timestamp": headerPayload.get("svix-timestamp")!,
					"svix-signature": headerPayload.get("svix-signature")!,
				},
			});

			if (result.type === "user.created") {
				const email = result.data.email_addresses?.[0]?.email_address ?? "";
				const clerkHostname = process.env.CLERK_HOSTNAME;

				if (!clerkHostname) {
					throw new Error("CLERK_HOSTNAME environment variable is not set");
				}

				await ctx.runMutation(internal.users.createUser, {
					tokenIdentifier: `https://${clerkHostname}|${result.data.id}`,
					name: `${result.data.first_name ?? ""} ${result.data.last_name ?? ""}`,
					image: result.data.image_url,
					email: email,
				});
			}

			return new Response(null, {
				status: 200,
			});
		} catch (err) {
			console.error("Error processing webhook:", err);
			return new Response("Webhook Error", {
				status: 400,
			});
		}
	}),
});

export default http;
