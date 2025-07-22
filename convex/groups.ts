import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import {
	getCurrentUser,
	getCurrentUserOrNull,
	authorizeGroupAccess,
} from "./lib/auth";
import { INDEX_NAMES, DB_ERRORS } from "./lib/database";

export const getGroups = query({
	async handler(ctx) {
		const user = await getCurrentUserOrNull(ctx);

		if (!user) {
			return [];
		}

		return await ctx.db
			.query("groups")
			.withIndex(INDEX_NAMES.BY_USER_ID, (q) => q.eq("userId", user._id))
			.collect();
	},
});

export const createGroup = mutation({
	args: {
		name: v.string(),
		color: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		return await ctx.db.insert("groups", {
			userId: user._id,
			name: args.name,
			color: args.color || "#3b82f6", // Default blue color
			description: args.description,
		});
	},
});

export const updateGroup = mutation({
	args: {
		id: v.id("groups"),
		name: v.optional(v.string()),
		color: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	async handler(ctx, args) {
		const { group } = await authorizeGroupAccess(ctx, args.id);

		const updateData: {
			name?: string;
			color?: string;
			description?: string;
		} = {};
		if (args.name !== undefined) updateData.name = args.name;
		if (args.color !== undefined) updateData.color = args.color;
		if (args.description !== undefined)
			updateData.description = args.description;

		await ctx.db.patch(args.id, updateData);
	},
});

export const deleteGroup = mutation({
	args: {
		id: v.id("groups"),
	},
	async handler(ctx, args) {
		const { user } = await authorizeGroupAccess(ctx, args.id);

		// Remove this group from all recipients
		const recipients = await ctx.db
			.query("recipients")
			.withIndex(INDEX_NAMES.BY_USER_ID, (q) => q.eq("userId", user._id))
			.collect();

		for (const recipient of recipients) {
			if (recipient.groupIds?.includes(args.id)) {
				const updatedGroupIds = recipient.groupIds.filter(
					(id) => id !== args.id
				);
				await ctx.db.patch(recipient._id, {
					groupIds: updatedGroupIds.length > 0 ? updatedGroupIds : undefined,
				});
			}
		}

		await ctx.db.delete(args.id);
	},
});

export const addRecipientToGroup = mutation({
	args: {
		recipientId: v.id("recipients"),
		groupId: v.id("groups"),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		const recipient = await ctx.db.get(args.recipientId);
		const group = await ctx.db.get(args.groupId);

		if (!recipient || recipient.userId !== user._id) {
			throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
		}

		if (!group || group.userId !== user._id) {
			throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
		}

		const currentGroupIds = recipient.groupIds || [];
		if (!currentGroupIds.includes(args.groupId)) {
			await ctx.db.patch(args.recipientId, {
				groupIds: [...currentGroupIds, args.groupId],
			});
		}
	},
});

export const removeRecipientFromGroup = mutation({
	args: {
		recipientId: v.id("recipients"),
		groupId: v.id("groups"),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		const recipient = await ctx.db.get(args.recipientId);

		if (!recipient || recipient.userId !== user._id) {
			throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
		}

		const currentGroupIds = recipient.groupIds || [];
		const updatedGroupIds = currentGroupIds.filter((id) => id !== args.groupId);

		await ctx.db.patch(args.recipientId, {
			groupIds: updatedGroupIds.length > 0 ? updatedGroupIds : undefined,
		});
	},
});

export const getGroupsWithCounts = query({
	async handler(ctx) {
		const user = await getCurrentUserOrNull(ctx);

		if (!user) {
			return [];
		}

		const groups = await ctx.db
			.query("groups")
			.withIndex(INDEX_NAMES.BY_USER_ID, (q) => q.eq("userId", user._id))
			.collect();

		const recipients = await ctx.db
			.query("recipients")
			.withIndex(INDEX_NAMES.BY_USER_ID, (q) => q.eq("userId", user._id))
			.collect();

		// Calculate counts for each group
		const groupsWithCounts = groups.map((group) => {
			const count = recipients.filter((recipient) =>
				recipient.groupIds?.includes(group._id)
			).length;
			return {
				...group,
				count,
			};
		});

		// Add special "All Recipients" and "Ungrouped" entries
		const totalCount = recipients.length;
		const ungroupedCount = recipients.filter(
			(recipient) => !recipient.groupIds || recipient.groupIds.length === 0
		).length;

		return {
			allRecipients: {
				_id: "all",
				name: "All Recipients",
				count: totalCount,
				color: "#6b7280",
			},
			ungrouped: {
				_id: "ungrouped",
				name: "Ungrouped",
				count: ungroupedCount,
				color: "#9ca3af",
			},
			groups: groupsWithCounts,
		};
	},
});
