import { type ComponentType, type ReactNode } from "react";
import { Id } from "../../convex/_generated/dataModel";

export interface Recipient {
	id: string;
	name: string;
	email: string;
	birthday: Date;
	userId: string;
}

export interface AnimationTemplate {
	id: Id<"animations">;
	name: string;
	description: string | ReactNode;
	previewUrl?: string | null;
	previewComponent?: ComponentType<{ isPreview?: boolean }>;
	isPremium?: boolean;
	isCustom?: boolean;
	createdAt?: number;
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
