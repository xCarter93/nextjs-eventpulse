import { type ComponentType, type ReactNode } from "react";

export interface Recipient {
	id: string;
	name: string;
	email: string;
	birthday: Date;
	userId: string;
}

export interface AnimationTemplate {
	id: string;
	name: string;
	description: string | ReactNode;
	previewUrl?: string;
	previewComponent?: ComponentType<{ isPreview?: boolean }>;
	isPremium?: boolean;
}

export interface ColorScheme {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
}

export interface UserSubscription {
	tier: "free" | "premium";
	features: {
		maxRecipients: number;
		maxAnimations: number;
		hasAutoSend: boolean;
		hasAdvancedTemplates: boolean;
	};
}
