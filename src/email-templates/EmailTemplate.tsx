import {
	Html,
	Head,
	Body,
	Container,
	Section,
	Heading,
	Text,
	Button,
	Img,
	Hr,
	Link,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { type EmailComponent } from "@/types/email-components";
import { type ColorScheme } from "@/types";

interface EmailTemplateProps {
	components: EmailComponent[];
	colorScheme?: ColorScheme;
}

function mapComponent(component: EmailComponent, colorScheme?: ColorScheme) {
	const textColor = colorScheme?.primary || "text-gray-900";

	switch (component.type) {
		case "heading":
			return (
				<Heading
					key={component.id}
					className={`text-2xl font-bold leading-tight text-center my-4 ${textColor}`}
				>
					{component.content}
				</Heading>
			);
		case "text":
			return (
				<Text
					key={component.id}
					className={`text-base leading-relaxed text-center my-4 ${textColor}`}
				>
					{component.content}
				</Text>
			);
		case "button":
			return (
				<Button
					key={component.id}
					href={component.url}
					className={`${
						colorScheme?.primary
							? "bg-[" + colorScheme.primary + "]"
							: "bg-blue-500"
					} text-white px-6 py-3 rounded-lg font-medium text-center inline-block my-4 hover:opacity-90`}
				>
					{component.content}
				</Button>
			);
		case "image":
			return (
				<Img
					key={component.id}
					src={component.url}
					alt={component.alt}
					className="w-full max-w-full h-auto rounded-lg my-4"
				/>
			);
	}
}

export function EmailTemplate({ components, colorScheme }: EmailTemplateProps) {
	return (
		<Html>
			<Head />
			<Tailwind>
				<Body className="m-0 p-0 bg-gray-50">
					<Container className="mx-auto my-5 max-w-[600px]">
						<Section
							className={`${
								colorScheme?.background
									? "bg-[" + colorScheme.background + "]"
									: "bg-white"
							} p-6 rounded-lg shadow-sm`}
						>
							{components.map((component) =>
								mapComponent(component, colorScheme)
							)}
							<Hr
								className={`my-8 border-t ${
									colorScheme?.accent
										? "border-[" + colorScheme.accent + "]"
										: "border-gray-200"
								}`}
							/>
							<Text
								className={`text-sm text-center mt-4 ${
									colorScheme?.secondary
										? "text-[" + colorScheme.secondary + "]"
										: "text-gray-600"
								}`}
							>
								Sent with ❤️ from{" "}
								<Link
									href="https://eventpulse.com"
									className={`${
										colorScheme?.primary
											? "text-[" + colorScheme.primary + "]"
											: "text-blue-500"
									} no-underline hover:underline`}
								>
									EventPulse
								</Link>
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
