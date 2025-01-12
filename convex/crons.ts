import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
	"cleanup-free-tier-animations",
	{ hourUTC: 0, minuteUTC: 0 }, // Run at midnight UTC
	internal.animations.cleanupFreeUserAnimations
);

export default crons;
