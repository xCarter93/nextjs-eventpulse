export interface AddressData {
	city: string;
	country: string;
	countryCode: string;
	coordinates: {
		latitude: number;
		longitude: number;
	};
}

export interface RecipientAddressData {
	city?: string;
	country?: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
}

export interface NotificationSettings {
	reminderDays: number;
	emailReminders: {
		events: boolean;
		birthdays: boolean;
		holidays: boolean;
	};
}

export interface SettingsFormData {
	address?: AddressData;
	calendar: {
		showHolidays: boolean;
	};
	upcomingEvents: {
		daysToShow: number;
		maxEvents: number;
	};
	notifications: NotificationSettings;
}
