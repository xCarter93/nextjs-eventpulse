import { parseDate as originalParseDate } from "../server-actions";

export function parseFlexibleDate(input: string): number {
	// Clean up the input
	const cleanInput = input.trim();

	// Handle MM/DD/YYYY format
	const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
	const mmddyyyyMatch = cleanInput.match(mmddyyyyPattern);
	if (mmddyyyyMatch) {
		const [, month, day, year] = mmddyyyyMatch;
		const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

		// Validate the date
		if (
			date.getMonth() === parseInt(month) - 1 &&
			date.getDate() === parseInt(day) &&
			date.getFullYear() === parseInt(year)
		) {
			return date.getTime();
		}
	}

	// Handle YYYY-MM-DD format
	const yyyymmddPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
	const yyyymmddMatch = cleanInput.match(yyyymmddPattern);
	if (yyyymmddMatch) {
		const [, year, month, day] = yyyymmddMatch;
		const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

		// Validate the date
		if (
			date.getMonth() === parseInt(month) - 1 &&
			date.getDate() === parseInt(day) &&
			date.getFullYear() === parseInt(year)
		) {
			return date.getTime();
		}
	}

	// Handle MM/DD format (current year)
	const mmddPattern = /^(\d{1,2})\/(\d{1,2})$/;
	const mmddMatch = cleanInput.match(mmddPattern);
	if (mmddMatch) {
		const [, month, day] = mmddMatch;
		const currentYear = new Date().getFullYear();
		const date = new Date(currentYear, parseInt(month) - 1, parseInt(day));

		// Validate the date
		if (
			date.getMonth() === parseInt(month) - 1 &&
			date.getDate() === parseInt(day)
		) {
			return date.getTime();
		}
	}

	// Fallback to the original parseDate function for natural language
	try {
		return originalParseDate(cleanInput);
	} catch {
		throw new Error(
			`Could not parse date "${cleanInput}". Please use formats like "MM/DD/YYYY", "March 15, 2024", or "next Tuesday".`
		);
	}
}

export function validateDateRange(year: number): void {
	const currentYear = new Date().getFullYear();
	if (year < 1900 || year > currentYear + 10) {
		throw new Error(
			`The year ${year} seems unusual. Please provide a year between 1900 and ${currentYear + 10}.`
		);
	}
}
