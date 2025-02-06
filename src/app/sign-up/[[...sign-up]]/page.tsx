"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<div className="flex items-center justify-center min-h-screen py-2 px-4 sm:px-6 lg:px-8 bg-background">
			<SignUp
				appearance={{
					elements: {
						formButtonPrimary:
							"bg-primary text-primary-foreground hover:bg-primary/90",
						card: "dark:bg-zinc-900 bg-white shadow-lg border border-border before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-b before:from-primary/5 before:to-primary/10 before:blur-xl relative",
						headerTitle: "text-foreground",
						headerSubtitle: "text-muted-foreground",
						socialButtonsBlockButton:
							"dark:bg-zinc-800 bg-gray-100 text-foreground hover:bg-muted/90",
						formFieldLabel: "text-foreground",
						formFieldInput:
							"dark:bg-zinc-800 bg-gray-50 text-foreground border-input focus:ring-2 focus:ring-primary",
						dividerLine: "bg-border",
						dividerText: "text-muted-foreground",
						footerActionLink: "text-primary hover:text-primary/90",
						formFieldInputShowPasswordButton: "text-muted-foreground",
						otpCodeFieldInput:
							"dark:bg-zinc-800 bg-gray-50 text-foreground border-input focus:ring-2 focus:ring-primary",
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
				fallbackRedirectUrl="/dashboard"
				routing="path"
				path="/sign-up"
				signInUrl="/sign-in"
			/>
		</div>
	);
}
