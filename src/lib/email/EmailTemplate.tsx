import {
	Html,
	Head,
	Body,
	Container,
	Section,
	Text,
	Heading,
	Img,
	Link,
} from "@react-email/components";

interface EmailTemplateProps {
	heading: string;
	animationUrl: string;
	bodyText: string;
}

export default function EmailTemplate({
	heading,
	animationUrl,
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
					<Section style={animationContainer}>
						{/* Using standard img tag as next/image is not supported in emails */}
						<Img
							src={animationUrl}
							alt="Celebration animation"
							width={400}
							height={400}
							style={imageStyle}
						/>
					</Section>
					<Section>
						<Text style={text}>{bodyText}</Text>
					</Section>
					<Section>
						<Text style={footer}>
							Sent with ❤️ from{" "}
							<Link href="https://animgreet.com" style={footerLink}>
								AnimGreet
							</Link>
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: "#ffffff",
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
	margin: "0 auto",
	padding: "20px 0 48px",
	maxWidth: "600px",
};

const headingStyle = {
	fontSize: "32px",
	lineHeight: "1.3",
	fontWeight: "700",
	color: "#484848",
	textAlign: "center" as const,
};

const animationContainer = {
	margin: "32px 0",
	textAlign: "center" as const,
};

const imageStyle = {
	maxWidth: "100%",
	height: "auto",
	borderRadius: "4px",
};

const text = {
	fontSize: "18px",
	lineHeight: "1.6",
	color: "#484848",
	textAlign: "center" as const,
};

const footer = {
	fontSize: "14px",
	color: "#666666",
	textAlign: "center" as const,
	marginTop: "32px",
	borderTop: "1px solid #eaeaea",
	paddingTop: "24px",
};

const footerLink = {
	color: "#000000",
	textDecoration: "none",
	fontWeight: "500" as const,
};
