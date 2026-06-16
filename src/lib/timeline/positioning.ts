import { differenceInCalendarDays, max, min, parseISO } from "date-fns";

import type { TimelineBarPosition } from "./types";

export function getBarPosition(
	checkIn: string,
	checkOut: string,
	weekStart: string,
	weekEnd: string,
): TimelineBarPosition | null {
	const visibleStart = max([parseISO(checkIn), parseISO(weekStart)]);
	const visibleEnd = min([parseISO(checkOut), parseISO(weekEnd)]);

	if (visibleStart >= visibleEnd) {
		return null;
	}

	const startOffset = differenceInCalendarDays(
		visibleStart,
		parseISO(weekStart),
	);
	const durationDays = differenceInCalendarDays(visibleEnd, visibleStart);

	return {
		leftPct: (startOffset / 7) * 100,
		widthPct: (durationDays / 7) * 100,
	};
}
