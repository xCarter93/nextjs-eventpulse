import {
	Html,
	Head,
	Body,
	Container,
	Section,
	Heading,
	Text,
	Hr,
	Link,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface Event {
	type: "birthday" | "event" | "holiday";
	name: string;
	date: number;
	description?: string;
}

interface ReminderEmailTemplateProps {
	userName: string;
	events: Event[];
}

const formatDate = (timestamp: number): string => {
	const date = new Date(timestamp);
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});
};

export function ReminderEmailTemplate({
	userName,
	events,
}: ReminderEmailTemplateProps) {
	return (
		<Html>
			<Head />
			<Tailwind>
				<Body className="bg-gray-50 font-sans">
					<Container className="mx-auto my-5 max-w-[600px]">
						<Section className="bg-white p-6 rounded-lg shadow-sm">
							<Heading className="text-2xl font-bold text-gray-900 mb-6">
								Hello {userName},
							</Heading>
							<Text className="text-base text-gray-700 mb-6">
								Here are your upcoming events:
							</Text>

							<div className="space-y-4">
								{events.map((event, index) => (
									<div
										key={index}
										className="p-4 border border-gray-200 rounded-lg"
									>
										<Heading className="text-lg font-semibold text-gray-900 mb-2">
											{event.name} -{" "}
											{event.type.charAt(0).toUpperCase() + event.type.slice(1)}
										</Heading>
										<Text className="text-base text-gray-700 mb-0">
											{formatDate(event.date)}
										</Text>
										{event.description && (
											<Text className="text-sm text-gray-500 mt-2 mb-0">
												{event.description}
											</Text>
										)}
									</div>
								))}
							</div>

							<Hr className="my-8 border-t border-gray-200" />
							<Text className="text-sm text-center text-gray-600">
								Sent with ❤️ from{" "}
								<Link
									href="https://eventpulse.com"
									className="text-blue-500 no-underline hover:underline"
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
