import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";
import { INDEX_NAMES, DB_ERRORS } from "./lib/database";

// Generate an upload URL for audio files
export const generateUploadUrl = mutation(async (ctx) => {
	return await ctx.storage.generateUploadUrl();
});

// Get the URL for an audio file
export const getAudioUrl = query({
	args: { storageId: v.id("_storage") },
	async handler(ctx, args) {
		return await ctx.storage.getUrl(args.storageId);
	},
});

// Get all audio files for the current user
export const getUserAudioFiles = query({
	handler: async (ctx) => {
		const user = await getCurrentUserOrNull(ctx);

		if (!user) {
			return [];
		}

		// Get audio files for the user
		const audioFiles = await ctx.db
			.query("audioFiles")
			.withIndex(INDEX_NAMES.BY_USER_ID, (q) => q.eq("userId", user._id))
			.collect();

		// Add URL to each audio file
		return Promise.all(
			audioFiles.map(async (audioFile) => {
				const url = await ctx.storage.getUrl(audioFile.storageId);
				return {
					_id: audioFile._id,
					title: audioFile.title,
					isRecorded: audioFile.isRecorded,
					createdAt: audioFile.createdAt,
					url,
				};
			})
		);
	},
});

// Store a new audio file
export const storeAudioFile = mutation({
	args: {
		storageId: v.id("_storage"),
		title: v.string(),
		isRecorded: v.boolean(),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		return await ctx.db.insert("audioFiles", {
			userId: user._id,
			storageId: args.storageId,
			title: args.title,
			isRecorded: args.isRecorded,
			createdAt: Date.now(),
		});
	},
});

// Delete an audio file
export const deleteAudioFile = mutation({
	args: {
		id: v.id("audioFiles"),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		const audioFile = await ctx.db.get(args.id);
		if (!audioFile || audioFile.userId !== user._id) {
			throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
		}

		// Delete the storage file
		await ctx.storage.delete(audioFile.storageId);

		// Delete the database record
		await ctx.db.delete(args.id);
	},
});

// Update an audio file title
export const updateAudioFile = mutation({
	args: {
		id: v.id("audioFiles"),
		title: v.string(),
	},
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		const audioFile = await ctx.db.get(args.id);
		if (!audioFile || audioFile.userId !== user._id) {
			throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
		}

		await ctx.db.patch(args.id, {
			title: args.title,
		});
	},
});

// Get a specific audio file by ID
export const getAudioFile = query({
	args: { id: v.id("audioFiles") },
	async handler(ctx, args) {
		const user = await getCurrentUser(ctx);

		const audioFile = await ctx.db.get(args.id);
		if (!audioFile || audioFile.userId !== user._id) {
			throw new ConvexError(DB_ERRORS.RESOURCE_NOT_FOUND);
		}

		const url = await ctx.storage.getUrl(audioFile.storageId);
		return {
			...audioFile,
			url,
		};
	},
});
