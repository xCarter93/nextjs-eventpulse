import { v } from "convex/values";
import {
	mutation,
	query,
	internalQuery,
	MutationCtx,
	QueryCtx,
} from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";

// Types for event handling
export type EventType = "birthday" | "event";
export type Event = {
	type: EventType;
	name: string;
	date: number;
	description?: string;
};

// Error messages
const ERRORS = {
	NOT_AUTHENTICATED: "You must be logged in to perform this action",
	USER_NOT_FOUND: "User not found",
	EVENT_NOT_FOUND: "Event not found",
	ACCESS_DENIED: "You don't have permission to access this event",
} as const;

// Authentication helper
async function authenticateUser(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new ConvexError(ERRORS.NOT_AUTHENTICATED);
	}

	const user = await ctx.db
		.query("users")
		.withIndex("by_tokenIdentifier", (q) =>
			q.eq("tokenIdentifier", identity.tokenIdentifier)
		)
		.first();

	if (!user) {
		throw new ConvexError(ERRORS.USER_NOT_FOUND);
	}

	return { identity, user };
}

export const createEvent = mutation({
	args: {
		name: v.string(),
		date: v.number(),
		isRecurring: v.boolean(),
	},
	async handler(ctx, args) {
		const { user } = await authenticateUser(ctx);

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
		const { user } = await authenticateUser(ctx);

		const event = await ctx.db.get(args.id);
		if (!event) {
			throw new ConvexError(ERRORS.EVENT_NOT_FOUND);
		}

		if (event.userId !== user._id) {
			throw new ConvexError(ERRORS.ACCESS_DENIED);
		}

		await ctx.db.delete(args.id);
	},
});

export const getEvents = query({
	async handler(ctx) {
		try {
			const { user } = await authenticateUser(ctx);

			return await ctx.db
				.query("customEvents")
				.withIndex("by_userId", (q) => q.eq("userId", user._id))
				.collect();
		} catch (err) {
			if (
				err instanceof ConvexError &&
				err.message === ERRORS.NOT_AUTHENTICATED
			) {
				return [];
			}
			throw err;
		}
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

// Helper function to get upcoming events for a user
export const getUpcomingEvents = internalQuery({
	args: {
		userId: v.id("users"),
		startDate: v.number(),
		endDate: v.number(),
		includeEvents: v.boolean(),
		includeBirthdays: v.boolean(),
	},
	async handler(ctx, args): Promise<Event[]> {
		const events: Event[] = [];

		// Get birthdays if enabled
		if (args.includeBirthdays) {
			const recipients = await ctx.runQuery(
				internal.recipients.listRecipients,
				{ userId: args.userId }
			);

			for (const recipient of recipients) {
				const birthdayDate = new Date(recipient.birthday);
				const thisYearBirthday = new Date(
					new Date().getFullYear(),
					birthdayDate.getMonth(),
					birthdayDate.getDate()
				);

				if (
					thisYearBirthday.getTime() >= args.startDate &&
					thisYearBirthday.getTime() <= args.endDate
				) {
					events.push({
						type: "birthday",
						name: recipient.name,
						date: thisYearBirthday.getTime(),
						description: `Birthday celebration`,
					});
				}
			}
		}

		// Get custom events if enabled
		if (args.includeEvents) {
			const customEvents = await ctx.db
				.query("customEvents")
				.withIndex("by_userId", (q) => q.eq("userId", args.userId))
				.collect();

			for (const event of customEvents) {
				const eventDate = new Date(event.date);
				if (
					eventDate.getTime() >= args.startDate &&
					eventDate.getTime() <= args.endDate
				) {
					events.push({
						type: "event",
						name: event.name,
						date: eventDate.getTime(),
					});
				}
			}
		}

		return events.sort((a, b) => a.date - b.date);
	},
});
