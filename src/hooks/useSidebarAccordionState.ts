"use client";

import { useState, useEffect } from "react";

interface AccordionStates {
	userStats: string[];
	upcomingEvents: string[];
	quickActions: string[];
}

const DEFAULT_ACCORDION_STATES: AccordionStates = {
	userStats: [],
	upcomingEvents: [],
	quickActions: [],
};

const STORAGE_KEY = "sidebar-accordion-states";

export function useSidebarAccordionState() {
	const [accordionStates, setAccordionStates] = useState<AccordionStates>(
		DEFAULT_ACCORDION_STATES
	);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load state from localStorage on mount
	useEffect(() => {
		if (typeof window !== "undefined") {
			try {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored) {
					const parsed = JSON.parse(stored);
					setAccordionStates({
						...DEFAULT_ACCORDION_STATES,
						...parsed,
					});
				}
			} catch (error) {
				console.warn(
					"Failed to load accordion states from localStorage:",
					error
				);
			} finally {
				setIsLoaded(true);
			}
		} else {
			setIsLoaded(true);
		}
	}, []);

	// Save state to localStorage whenever it changes
	useEffect(() => {
		if (isLoaded && typeof window !== "undefined") {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(accordionStates));
			} catch (error) {
				console.warn("Failed to save accordion states to localStorage:", error);
			}
		}
	}, [accordionStates, isLoaded]);

	const updateAccordionState = (
		section: keyof AccordionStates,
		selectedKeys: string[]
	) => {
		setAccordionStates((prev) => ({
			...prev,
			[section]: selectedKeys,
		}));
	};

	const getAccordionState = (section: keyof AccordionStates): string[] => {
		return accordionStates[section];
	};

	return {
		accordionStates,
		updateAccordionState,
		getAccordionState,
		isLoaded,
	};
}
