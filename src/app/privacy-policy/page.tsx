import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
	title: "Privacy Policy | EventPulse",
	description:
		"Privacy Policy for EventPulse - Learn how we protect and handle your data.",
};

export default function PrivacyPolicyPage() {
	return (
		<div className="container max-w-4xl py-8 space-y-8">
			<h1 className="text-4xl font-bold">Privacy Policy</h1>
			<Card>
				<CardContent className="prose dark:prose-invert pt-6 max-w-none">
					<h2>1. Introduction</h2>
					<p>
						At EventPulse, we take your privacy seriously. This Privacy Policy
						explains how we collect, use, disclose, and safeguard your
						information when you use our service. By using EventPulse, you agree
						to the collection and use of information in accordance with this
						policy.
					</p>

					<h2>2. Information We Collect</h2>
					<h3>Personal Information</h3>
					<ul>
						<li>
							Name and email address for account creation and communication
						</li>
						<li>Profile information that you choose to provide</li>
						<li>Calendar data and event information you input</li>
						<li>Recipients&apos; information (names, birthdays, addresses)</li>
						<li>Payment information when subscribing to premium features</li>
					</ul>

					<h3>Usage Information</h3>
					<ul>
						<li>Log data and device information</li>
						<li>Analytics data about how you use our service</li>
						<li>Preferences and settings you configure</li>
					</ul>

					<h2>3. How We Use Your Information</h2>
					<ul>
						<li>To provide and maintain our service</li>
						<li>To notify you about changes and updates</li>
						<li>To provide customer support and respond to inquiries</li>
						<li>To improve our service through usage analysis</li>
						<li>To process payments and prevent fraudulent transactions</li>
						<li>To send scheduled emails and event notifications</li>
					</ul>

					<h2>4. Data Storage and Security</h2>
					<p>
						We implement industry-standard security measures to protect your
						data:
					</p>
					<ul>
						<li>Encryption of data in transit and at rest</li>
						<li>Regular security assessments and updates</li>
						<li>Secure access controls and authentication</li>
						<li>Regular backups and data redundancy</li>
					</ul>

					<h2>5. Third-Party Services</h2>
					<p>
						We work with trusted third-party services for specific functions:
					</p>
					<ul>
						<li>Stripe for payment processing</li>
						<li>Google Calendar for event synchronization</li>
						<li>Analytics providers to improve our service</li>
						<li>Email service providers for notification delivery</li>
					</ul>

					<h2>6. Your Data Rights</h2>
					<p>You have the following rights regarding your data:</p>
					<ul>
						<li>Access your personal data and request copies</li>
						<li>Correct any inaccurate information</li>
						<li>Request deletion of your data</li>
						<li>Export your data in a portable format</li>
						<li>Opt-out of marketing communications</li>
						<li>Withdraw consent for data processing</li>
					</ul>

					<h2>7. Data Retention</h2>
					<p>
						We retain your data for as long as your account is active or as
						needed to provide services. You can request data deletion at any
						time, and we&apos;ll remove it unless we&apos;re required to keep it
						for legal reasons.
					</p>

					<h2>8. Children&apos;s Privacy</h2>
					<p>
						Our service is not intended for users under 13 years of age. We do
						not knowingly collect personal information from children under 13.
					</p>

					<h2>9. Contact Us</h2>
					<p>
						For questions about this Privacy Policy or your data, contact us at{" "}
						<a href="mailto:support@eventpulse.com" className="text-primary">
							support@eventpulse.com
						</a>
						.
					</p>

					<div className="mt-8 text-sm text-muted-foreground">
						<p>Last updated: February 09, 2025</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
