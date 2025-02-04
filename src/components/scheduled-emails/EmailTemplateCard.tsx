import { Card, CardBody } from "@heroui/react";
import { Skeleton } from "@heroui/react";
import { type EmailComponent } from "@/types/email-components";

const TEMPLATES = {
	headerImageText: {
		id: "header-image-text",
		name: "Header with Image and Text",
		components: [
			{
				id: "template-header",
				type: "heading" as const,
				content: "New Heading",
			},
			{
				id: "template-image",
				type: "image" as const,
				url: "",
				alt: "Image description",
			},
			{
				id: "template-text",
				type: "text" as const,
				content: "New text block",
			},
		] as EmailComponent[],
	},
	headerText: {
		id: "header-text",
		name: "Header and Text",
		components: [
			{
				id: "template-header",
				type: "heading" as const,
				content: "New Heading",
			},
			{
				id: "template-text",
				type: "text" as const,
				content: "New text block",
			},
		] as EmailComponent[],
	},
};

interface EmailTemplateCardProps {
	templateId: keyof typeof TEMPLATES;
	onSelect?: (components: EmailComponent[]) => void;
}

export function EmailTemplateCard({
	templateId,
	onSelect,
}: EmailTemplateCardProps) {
	const template = TEMPLATES[templateId];

	const handleClick = () => {
		// Generate new IDs for the components to ensure uniqueness
		const componentsWithNewIds = template.components.map((component) => ({
			...component,
			id: `${component.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		}));
		onSelect?.(componentsWithNewIds);
	};

	const renderSkeletons = () => {
		return template.components.map((component, index) => {
			switch (component.type) {
				case "heading":
					return (
						<Skeleton
							key={index}
							className="w-4/5 mx-auto rounded-lg"
							isLoaded={true}
						>
							<div className="h-4 w-full rounded-lg bg-primary" />
						</Skeleton>
					);
				case "image":
					return (
						<Skeleton
							key={index}
							className="w-full max-w-[200px] mx-auto rounded-lg"
							isLoaded={true}
						>
							<div className="h-24 w-full rounded-lg bg-primary" />
						</Skeleton>
					);
				case "text":
					return (
						<div
							key={index}
							className="w-full flex flex-col items-center space-y-3"
						>
							<Skeleton className="w-3/5 rounded-lg" isLoaded={true}>
								<div className="h-3 w-full rounded-lg bg-primary" />
							</Skeleton>
							<Skeleton className="w-4/5 rounded-lg" isLoaded={true}>
								<div className="h-3 w-full rounded-lg bg-primary-300" />
							</Skeleton>
							<Skeleton className="w-2/5 rounded-lg" isLoaded={true}>
								<div className="h-3 w-full rounded-lg bg-primary-200" />
							</Skeleton>
						</div>
					);
			}
		});
	};

	return (
		<div className="group perspective-[1000px] w-[200px] h-[300px]">
			<div className="relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
				{/* Front of card - Template name */}
				<Card
					className="absolute w-full h-full backface-hidden hover:border-primary transition-colors flex items-center justify-center"
					radius="lg"
				>
					<CardBody className="flex flex-col items-center justify-center space-y-3">
						<h3 className="text-lg font-semibold text-center">
							{template.name}
						</h3>
						<p className="text-sm text-muted-foreground text-center">
							Hover to preview template
							<br />
							Click to use it
						</p>
					</CardBody>
				</Card>

				{/* Back of card - Skeleton preview */}
				<Card
					isPressable
					onPress={handleClick}
					className="absolute w-full h-full [transform:rotateY(180deg)] backface-hidden hover:border-primary transition-colors"
					radius="lg"
				>
					<CardBody className="flex flex-col justify-center items-center space-y-5 p-4">
						{renderSkeletons()}
					</CardBody>
				</Card>
			</div>
		</div>
	);
}

export function EmailTemplateGrid({
	onSelect,
}: {
	onSelect?: (components: EmailComponent[]) => void;
}) {
	return (
		<div className="flex gap-6 justify-center">
			<EmailTemplateCard templateId="headerImageText" onSelect={onSelect} />
			<EmailTemplateCard templateId="headerText" onSelect={onSelect} />
		</div>
	);
}
