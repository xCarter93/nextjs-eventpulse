// Collection of email-safe SVG icons that match our Lucide icons
export const emailIcons = {
	calendar: (color: string) => {
		// Create the SVG string with the custom color
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`;
		// Convert to base64
		const base64 = btoa(svg);
		return `<img src="data:image/svg+xml;base64,${base64}" width="48" height="48" style="display: block;" alt="Calendar icon" />`;
	},
	// Add more icons as needed
} as const;
