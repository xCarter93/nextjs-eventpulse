import {
	Html,
	Head,
	Body,
	Container,
	Section,
	Text,
	Heading,
	Img,
	Preview,
} from "@react-email/components";
import * as React from "react";

interface EmailTemplateProps {
	heading: string;
	lottieAnimation: React.ReactNode;
	bodyText: string;
}

export default function EmailTemplate({
	heading,
	lottieAnimation,
	bodyText,
}: EmailTemplateProps) {
	return (
		<Html>
			<Head />
			<Preview>{heading}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>{heading}</Heading>
					<Section style={imageContainer}>
						{typeof lottieAnimation === "string" ? (
							<Img
								src={lottieAnimation}
								alt="Animation"
								width="400"
								height="400"
								style={image}
							/>
						) : (
							lottieAnimation
						)}
					</Section>
					<Text style={text}>{bodyText}</Text>
					<Text style={footer}>Sent with ❤️ from AnimGreet</Text>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: "#f9fafb",
	margin: "0 auto",
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
	margin: "auto",
	padding: "20px",
	maxWidth: "600px",
	backgroundColor: "white",
	borderRadius: "8px",
	boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const h1 = {
	color: "#111827",
	fontSize: "24px",
	fontWeight: "600",
	lineHeight: "32px",
	margin: "0 0 20px",
	textAlign: "center" as const,
};

const imageContainer = {
	textAlign: "center" as const,
	margin: "20px 0",
};

const image = {
	maxWidth: "100%",
	height: "auto",
	margin: "0 auto",
};

const text = {
	color: "#374151",
	fontSize: "16px",
	lineHeight: "24px",
	margin: "20px 0",
	textAlign: "center" as const,
};

const footer = {
	color: "#6b7280",
	fontSize: "14px",
	margin: "20px 0 0",
	padding: "20px 0 0",
	borderTop: "1px solid #e5e7eb",
	textAlign: "center" as const,
};
