import { Metadata } from "next";

export const metadata: Metadata = {
	title: "New Scheduled Email | AnimGreet",
	description: "Create a new scheduled email to send to your recipients.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
