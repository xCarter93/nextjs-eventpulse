"use server";

import { Resend } from "resend";
import EmailTemplate from "@/components/email/EmailTemplate";
import { type ReactNode } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
	to: string;
	subject: string;
	heading: string;
	lottieAnimation: ReactNode;
	bodyText: string;
}

export async function sendEmail({
	to,
	subject,
	heading,
	lottieAnimation,
	bodyText,
}: SendEmailProps) {
	if (!process.env.RESEND_API_KEY) {
		throw new Error("Missing Resend API key");
	}

	try {
		const data = await resend.emails.send({
			from: "AnimGreet <notifications@animgreet.com>",
			to: [to],
			subject: subject,
			react: EmailTemplate({
				heading,
				lottieAnimation,
				bodyText,
			}),
		});

		return { success: true, data };
	} catch (error) {
		return { success: false, error };
	}
}
