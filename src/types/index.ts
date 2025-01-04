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
	description: string;
	previewUrl: string;
	isPremium: boolean;
}

export interface CustomAnimation {
	id: string;
	templateId: string;
	recipientId: string;
	userId: string;
	customText: string;
	colorScheme: ColorScheme;
	createdAt: Date;
	url: string;
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
