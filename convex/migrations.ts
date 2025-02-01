import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

export const migrations = new Migrations<DataModel>(components.migrations);

// Export a general-purpose runner for all migrations
export const run = migrations.runner();

// Define our first migration for user fields
export const addUserFields = migrations.define({
	table: "users",
	migrateOne: async (ctx, user) => {
		await ctx.db.patch(user._id, {
			lastSignedInDate: user.lastSignedInDate ?? Date.now(),
			hasSeenTour: user.hasSeenTour ?? false,
		});
	},
});

// Create a runner specifically for this migration
export const runAddUserFields = run;
