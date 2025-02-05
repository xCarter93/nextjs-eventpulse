export type EmailComponentType =
	| "heading"
	| "text"
	| "button"
	| "image"
	| "event";

export interface BaseEmailComponent {
	id: string;
	type: EmailComponentType;
}

export interface HeadingComponent extends BaseEmailComponent {
	type: "heading";
	content: string;
}

export interface TextComponent extends BaseEmailComponent {
	type: "text";
	content: string;
}

export interface ButtonComponent extends BaseEmailComponent {
	type: "button";
	content: string;
	url: string;
}

export interface ImageComponent extends BaseEmailComponent {
	type: "image";
	url: string;
	alt: string;
}

export interface EventComponent extends BaseEmailComponent {
	type: "event";
	eventId?: string; // ID of the selected event (custom event or birthday)
	eventType: "birthday" | "custom"; // Type of event
	// Placeholder fields when no event is selected
	placeholderTitle: string;
	placeholderDate: number;
}

export type EmailComponent =
	| HeadingComponent
	| TextComponent
	| ButtonComponent
	| ImageComponent
	| EventComponent;

export interface EmailContent {
	components: EmailComponent[];
}
