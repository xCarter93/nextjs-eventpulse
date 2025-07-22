import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";
import { INDEX_NAMES, DB_ERRORS } from "./lib/database";

export const createEvent = mutation({
	args: {
		name: v.string(),
		date: v.number(),
		isRecurring: v.boolean(),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		return await ctx.db.insert("customEvents", {
			userId: user._id,
			name: args.name,
			date: args.date,
			isRecurring: args.isRecurring,
		});
	},
});

export const deleteEvent = mutation({
	args: {
		id: v.id("customEvents"),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		const event = await ctx.db.get(args.id);
		if (!event || event.userId !== user._id) {
			throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
		}

		await ctx.db.delete(args.id);
	},
});

export const getEvents = query({
	async handler(ctx) {
		const user = await getCurrentUserOrNull(ctx);

		if (!user) {
			return [];
		}

		return await ctx.db
			.query("customEvents")
			.withIndex(INDEX_NAMES.BY_USER_ID, (q) => q.eq("userId", user._id))
			.collect();
	},
});

export const listEvents = internalQuery({
	args: {
		userId: v.id("users"),
	},
	async handler(ctx, args) {
		return await ctx.db
			.query("customEvents")
			.withIndex(INDEX_NAMES.BY_USER_ID, (q) => q.eq("userId", args.userId))
			.collect();
	},
});

export const syncGoogleCalendarEvents = mutation({
	args: {
		events: v.array(
			v.object({
				id: v.string(),
				title: v.string(),
				description: v.optional(v.string()),
				start: v.number(),
			})
		),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		// Delete existing Google Calendar events
		const existingEvents = await ctx.db
			.query("customEvents")
			.withIndex(INDEX_NAMES.BY_USER_ID, (q) => q.eq("userId", user._id))
			.filter((q) => q.eq(q.field("source"), "google"))
			.collect();

		for (const event of existingEvents) {
			await ctx.db.delete(event._id);
		}

		// Insert new events
		for (const event of args.events) {
			await ctx.db.insert("customEvents", {
				userId: user._id,
				name: event.title,
				date: event.start,
				isRecurring: false,
				source: "google",
			});
		}

		// Update last sync timestamp
		await ctx.db.patch(user._id, {
			lastGoogleCalendarSync: Date.now(),
		});

		return args.events.length;
	},
});
