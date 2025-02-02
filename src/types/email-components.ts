export type EmailComponentType = "heading" | "text" | "button" | "image";

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

export type EmailComponent =
	| HeadingComponent
	| TextComponent
	| ButtonComponent
	| ImageComponent;

export interface EmailContent {
	components: EmailComponent[];
}
