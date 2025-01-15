import { Metadata } from "next";

export const metadata: Metadata = {
	title: "New Scheduled Email | EventPulse",
	description: "Schedule a new email to be sent at a specific date and time.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
