import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every day at midnight UTC to clean up expired animations
crons.daily(
	"cleanup-free-tier-animations",
	{ hourUTC: 12, minuteUTC: 0 },
	internal.animations.cleanupFreeUserAnimations
);

// Run every day at midnight UTC to send reminder emails
crons.daily(
	"send-reminder-emails",
	{ hourUTC: 12, minuteUTC: 0 },
	internal.emails.sendReminderEmails
);

export default crons;
