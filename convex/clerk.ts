"use node";

import type { WebhookEvent } from "@clerk/clerk-sdk-node";
import { v } from "convex/values";
import { Webhook } from "svix";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || ``;

export const fulfill = internalAction({
	args: { headers: v.any(), payload: v.string() },
	handler: async (ctx, args) => {
		const wh = new Webhook(webhookSecret);
		const payload = wh.verify(args.payload, args.headers) as WebhookEvent;

		if (payload.type === "user.created") {
			await ctx.runMutation(internal.users.createUser, {
				tokenIdentifier: `https://${process.env.CLERK_HOSTNAME}|${payload.data.id}`,
				name: `${payload.data.first_name ?? ""} ${payload.data.last_name ?? ""}`,
				image: payload.data.image_url,
				email: payload.data.email_addresses?.[0]?.email_address ?? "",
			});
		}

		return payload;
	},
});
