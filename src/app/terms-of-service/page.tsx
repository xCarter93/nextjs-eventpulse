"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfService() {
	return (
		<div className="container max-w-4xl py-8 space-y-8">
			<h1 className="text-4xl font-bold">Terms of Service</h1>
			<Card>
				<CardContent className="prose dark:prose-invert pt-6 max-w-none">
					<h2>1. Introduction</h2>
					<p>
						Welcome to EventPulse. By using our service, you agree to these
						terms. Please read them carefully. These Terms of Service
						(&ldquo;Terms&rdquo;) govern your access to and use of
						EventPulse&apos;s services, including our website, animations,
						emails, and any other software or services offered by EventPulse
						(&ldquo;Services&rdquo;).
					</p>

					<h2>2. Service Description</h2>
					<p>
						EventPulse provides a platform for creating and sending animated
						greetings and managing event reminders. We offer both free and
						premium services, with different features available at different
						subscription levels.
					</p>

					<h2>3. Account Terms</h2>
					<ul>
						<li>You must be 13 years or older to use this service</li>
						<li>
							You must provide accurate and complete information when
							registering
						</li>
						<li>
							You are responsible for maintaining the security of your account
						</li>
						<li>
							You are responsible for all content posted and activity under your
							account
						</li>
					</ul>

					<h2>4. Payment Terms</h2>
					<ul>
						<li>
							Pro subscription is billed either monthly or annually, as selected
							at signup
						</li>
						<li>Payments are non-refundable</li>
						<li>
							You can cancel your subscription at any time, effective at the end
							of the current billing period
						</li>
						<li>
							Price changes will be notified at least 30 days before they take
							effect
						</li>
					</ul>

					<h2>5. User Content</h2>
					<p>
						You retain rights to any content you upload, but grant us license to
						store and display it. You must have rights to any content you
						upload, and it must not violate any laws or rights of others.
					</p>

					<h2>6. Service Limitations</h2>
					<ul>
						<li>Free accounts are limited to 5 recipients</li>
						<li>
							Custom animations in free accounts are stored for 10 days only
						</li>
						<li>We may impose usage limits to prevent abuse of the service</li>
					</ul>

					<h2>7. Acceptable Use</h2>
					<p>You agree not to:</p>
					<ul>
						<li>Use the service for any illegal purposes</li>
						<li>Send spam or unsolicited messages</li>
						<li>Upload malicious content or code</li>
						<li>Attempt to gain unauthorized access to the service</li>
						<li>Interfere with other users&apos; use of the service</li>
					</ul>

					<h2>8. Termination</h2>
					<p>
						We may suspend or terminate your account for violations of these
						terms, or for any other reason at our discretion. You may terminate
						your account at any time.
					</p>

					<h2>9. Disclaimers and Limitations</h2>
					<p>
						The service is provided &ldquo;as is&rdquo; without warranties of
						any kind. We are not liable for any damages arising from your use of
						the service.
					</p>

					<h2>10. Changes to Terms</h2>
					<p>
						We may modify these terms at any time. We will notify users of
						significant changes via email or through the service.
					</p>

					<h2>11. Contact Information</h2>
					<p>
						For questions about these terms or the service, please contact us at{" "}
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
