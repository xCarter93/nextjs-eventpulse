import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { 
	getCurrentUser, 
	getCurrentUserOrNull,
	authorizeResourceAccess,
	authorizeAudioFileAccess
} from "./lib/auth";

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
		const user = await getCurrentUser(ctx);

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
		const { user, audioFile } = await authorizeAudioFileAccess(ctx, args.audioFileId);

		// Delete the file from storage
		await ctx.storage.delete(audioFile.storageId);

		// Delete the record from the database
		await ctx.db.delete(args.audioFileId);

		return { success: true };
	},
});
