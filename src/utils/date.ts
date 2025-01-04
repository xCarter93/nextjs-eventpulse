export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

export function getDaysUntilBirthday(birthday: Date): number {
	const today = new Date();
	const nextBirthday = new Date(
		today.getFullYear(),
		birthday.getMonth(),
		birthday.getDate()
	);

	if (nextBirthday < today) {
		nextBirthday.setFullYear(today.getFullYear() + 1);
	}

	const diffTime = nextBirthday.getTime() - today.getTime();
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isWithinDays(date: Date, days: number): boolean {
	const daysUntil = getDaysUntilBirthday(date);
	return daysUntil <= days && daysUntil > 0;
}
