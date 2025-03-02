export type EmailComponentType =
	| "heading"
	| "text"
	| "button"
	| "image"
	| "event"
	| "divider"
	| "audio";

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

export interface DividerComponent extends BaseEmailComponent {
	type: "divider";
}

export interface AudioComponent extends BaseEmailComponent {
	type: "audio";
	audioUrl?: string; // URL to the audio file (either uploaded or recorded)
	title: string; // Title/description for the audio
	isRecorded: boolean; // Whether this was recorded or uploaded
}

export type EmailComponent =
	| HeadingComponent
	| TextComponent
	| ButtonComponent
	| ImageComponent
	| EventComponent
	| DividerComponent
	| AudioComponent;

export interface EmailContent {
	components: EmailComponent[];
}
