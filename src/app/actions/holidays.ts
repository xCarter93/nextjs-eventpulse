"use server";

interface Holiday {
	name: string;
	date: string;
	type: string;
	country: string;
}

export async function getPublicHolidays(
	year: number,
	countryCode: string
): Promise<
	Array<{ date: string; name: string; localName: string; type: string }>
> {
	try {
		const apiKey = process.env.API_NINJA_API_KEY;
		if (!apiKey) {
			throw new Error("API key not found");
		}

		const url = `https://api.api-ninjas.com/v1/holidays?country=${countryCode}&year=${year}&type=`;
		const response = await fetch(url, {
			headers: {
				"X-Api-Key": apiKey,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			next: { revalidate: 86400 }, // Cache for 24 hours
		});

		if (!response.ok) {
			throw new Error("Failed to fetch holidays");
		}

		const holidays: Holiday[] = await response.json();

		// Filter holidays to include observances and any type ending with "_holiday"
		return holidays
			.filter(
				(holiday) =>
					holiday.type.toLowerCase() === "observance" ||
					holiday.type.toLowerCase().endsWith("_holiday")
			)
			.map((holiday) => ({
				date: holiday.date,
				name: holiday.name,
				localName: holiday.name,
				type: holiday.type,
			}));
	} catch (error) {
		console.error("Error fetching holidays:", error);
		return [];
	}
}
