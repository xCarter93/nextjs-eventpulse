import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

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
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			return [];
		}

		// Get user
		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user) {
			throw new ConvexError("User not found");
		}

		// Get audio files for the user
		const audioFiles = await ctx.db
			.query("audioFiles")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
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

		const audioFileId = await ctx.db.insert("audioFiles", {
			userId: user._id,
			storageId: args.storageId,
			title: args.title,
			isRecorded: args.isRecorded,
			createdAt: Date.now(),
		});

		return audioFileId;
	},
});

// Delete an audio file
export const deleteAudioFile = mutation({
	args: {
		audioFileId: v.id("audioFiles"),
	},
	async handler(ctx, args) {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new ConvexError("Not authenticated");
		}

		const audioFile = await ctx.db.get(args.audioFileId);

		if (!audioFile) {
			throw new ConvexError("Audio file not found");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_tokenIdentifier", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier)
			)
			.first();

		if (!user || audioFile.userId !== user._id) {
			throw new ConvexError("Not authorized");
		}

		// Delete the file from storage
		await ctx.storage.delete(audioFile.storageId);

		// Delete the record from the database
		await ctx.db.delete(args.audioFileId);

		return { success: true };
	},
});
