import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { internal } from "./_generated/api";

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
export const runAddUserFields = migrations.runner(
	internal.migrations.addUserFields
);

// Migration to update user address structure
export const updateUserAddressStructure = migrations.define({
	table: "users",
	// Only migrate users who have an address defined
	customRange: (query) =>
		query.filter((q) => q.neq(q.field("settings.address"), undefined)),
	migrateOne: async (ctx, user) => {
		if (user.settings?.address) {
			const { city, country, countryCode, coordinates } = user.settings.address;
			// Create a new address object with only the fields we want to keep
			const updatedAddress = {
				city,
				country,
				countryCode,
				coordinates,
			};

			// Update the user's address with the new structure
			await ctx.db.patch(user._id, {
				settings: {
					...user.settings,
					address: updatedAddress,
				},
			});
		}
	},
});

// Migration to update recipient address structure
export const updateRecipientAddressStructure = migrations.define({
	table: "recipients",
	// Only migrate recipients who have address metadata
	customRange: (query) =>
		query.filter((q) => q.neq(q.field("metadata.address"), undefined)),
	migrateOne: async (ctx, recipient) => {
		if (recipient.metadata?.address) {
			const { city, country, coordinates } = recipient.metadata.address;
			// Create a new address object with only the fields we want to keep
			const updatedAddress = {
				city,
				country,
				coordinates,
			};

			// Update the recipient's address with the new structure
			await ctx.db.patch(recipient._id, {
				metadata: {
					...recipient.metadata,
					address: updatedAddress,
				},
			});
		}
	},
});

// Runner for user address structure migration
export const runUpdateUserAddressStructure = migrations.runner(
	internal.migrations.updateUserAddressStructure
);

// Runner for recipient address structure migration
export const runUpdateRecipientAddressStructure = migrations.runner(
	internal.migrations.updateRecipientAddressStructure
);

// Runner to execute both migrations in sequence
export const runAllAddressUpdates = migrations.runner([
	internal.migrations.updateUserAddressStructure,
	internal.migrations.updateRecipientAddressStructure,
]);
