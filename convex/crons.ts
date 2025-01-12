import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every day at midnight UTC to clean up expired animations
crons.daily(
	"cleanup-free-tier-animations",
	{ hourUTC: 0, minuteUTC: 0 },
	internal.animations.cleanupFreeUserAnimations
);

export default crons;
