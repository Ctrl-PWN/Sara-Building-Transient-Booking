import { differenceInCalendarDays, max, min, parseISO } from "date-fns";

import type { TimelineBarPosition } from "./types";

export function getBarPosition(
	checkInDate: string,
	checkOutDate: string,
	weekStart: string,
	weekEnd: string,
): TimelineBarPosition | null {
	const visibleStart = max([parseISO(checkInDate), parseISO(weekStart)]);
	const visibleEnd = min([parseISO(checkOutDate), parseISO(weekEnd)]);

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
