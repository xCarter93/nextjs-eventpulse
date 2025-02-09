import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getGoogleCalendarEvents } from "@/components/dashboard/googleCalendar";

export const createEvent = mutation({
	args: {
		name: v.string(),
		date: v.number(),
		isRecurring: v.boolean(),
	},
	async handler(ctx, args) {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

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
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		const event = await ctx.db.get(args.id);
		if (!event || event.userId !== user._id) {
			throw new ConvexError("Event not found or access denied");
		}

		await ctx.db.delete(args.id);
	},
});

export const getEvents = query({
	async handler(ctx) {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			return [];
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			return [];
		}

		return await ctx.db
			.query("customEvents")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
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
			.withIndex("by_userId", (q) => q.eq("userId", args.userId))
			.collect();
	},
});

export const syncGoogleCalendarEvents = mutation({
	async handler(ctx) {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		// Delete existing Google Calendar events
		const existingEvents = await ctx.db
			.query("customEvents")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.filter((q) => q.eq(q.field("source"), "google"))
			.collect();

		for (const event of existingEvents) {
			await ctx.db.delete(event._id);
		}

		// Fetch new events from Google Calendar
		const googleEvents = await getGoogleCalendarEvents(identity.subject);

		// Insert new events
		for (const event of googleEvents) {
			await ctx.db.insert("customEvents", {
				userId: user._id,
				name: event.title || "Untitled Event",
				date: new Date(event.start).getTime(),
				isRecurring: false,
				source: "google",
			});
		}

		return googleEvents.length;
	},
});
