import { type ReactNode } from "react";
import {
	Html,
	Head,
	Body,
	Container,
	Section,
	Text,
	Heading,
} from "@react-email/components";

interface EmailTemplateProps {
	heading: string;
	lottieAnimation: ReactNode;
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
			<Body style={main}>
				<Container style={container}>
					<Section>
						<Heading style={headingStyle}>{heading}</Heading>
					</Section>
					<Section style={animationContainer}>{lottieAnimation}</Section>
					<Section>
						<Text style={text}>{bodyText}</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
};

const headingStyle = {
	color: "#333",
	fontSize: "24px",
	fontWeight: "bold",
	textAlign: "center" as const,
	margin: "30px 0",
};

const animationContainer = {
	margin: "30px auto",
	width: "100%",
	maxWidth: "400px",
	textAlign: "center" as const,
};

const text = {
	color: "#333",
	fontSize: "16px",
	lineHeight: "24px",
	textAlign: "center" as const,
	margin: "0 48px",
};
