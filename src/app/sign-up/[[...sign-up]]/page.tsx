"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-background">
			<SignUp
				appearance={{
					elements: {
						formButtonPrimary:
							"bg-primary text-primary-foreground hover:bg-primary/90",
						card: "bg-card shadow-sm border border-border",
						headerTitle: "text-foreground",
						headerSubtitle: "text-muted-foreground",
						socialButtonsBlockButton:
							"bg-muted text-foreground hover:bg-muted/90",
						formFieldLabel: "text-foreground",
						formFieldInput: "bg-background text-foreground border-input",
						dividerLine: "bg-border",
						dividerText: "text-muted-foreground",
						footerActionLink: "text-primary hover:text-primary/90",
						formFieldInputShowPasswordButton: "text-muted-foreground",
						otpCodeFieldInput: "bg-background text-foreground border-input",
						formFieldSuccessText: "text-green-500",
						formFieldErrorText: "text-destructive",
						alert: "bg-destructive/10 text-destructive border-destructive/20",
						alertText: "text-destructive",
						identityPreviewText: "text-foreground",
						identityPreviewEditButton: "text-primary hover:text-primary/90",
						formResendCodeLink: "text-primary hover:text-primary/90",
						footer: "hidden",
					},
					layout: {
						socialButtonsPlacement: "bottom",
						showOptionalFields: false,
					},
				}}
				redirectUrl="/dashboard"
				routing="path"
				path="/sign-up"
				signInUrl="/sign-in"
			/>
		</div>
	);
}
