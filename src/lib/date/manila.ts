import { TZDate } from "@date-fns/tz";
import { format, startOfDay } from "date-fns";

export const MANILA_TZ = "Asia/Manila";

export function nowInManila(): TZDate {
	return new TZDate(new Date(), MANILA_TZ);
}

export function todayIsoInManila(): string {
	return format(nowInManila(), "yyyy-MM-dd");
}

export function parseManilaDate(dateStr: string): TZDate {
	return new TZDate(dateStr, MANILA_TZ);
}

export function startOfDayInManila(dateStr: string): TZDate {
	return startOfDay(parseManilaDate(dateStr)) as TZDate;
}

export function formatManilaDate(
	date: Date | string | number,
	dateFormat = "yyyy-MM-dd",
): string {
	const tzDate = toManilaTzDate(date);
	return format(tzDate, dateFormat);
}

function toManilaTzDate(date: Date | string | number): TZDate {
	if (date instanceof Date) {
		return new TZDate(date, MANILA_TZ);
	}
	if (typeof date === "number") {
		return new TZDate(date, MANILA_TZ);
	}
	return new TZDate(date, MANILA_TZ);
}

export function formatManilaDisplayDate(date: Date | string | number): string {
	return formatManilaDate(date, "EEEE, MMMM d, yyyy");
}

/**
 * Returns true if `iso` falls on the same Manila calendar day as
 * `referenceDate` (default: now), or any earlier day. Uses Asia/Manila so
 * the property's local "today" is the source of truth, not the server's tz.
 */
export function isSameManilaDayOrAfter(
	iso: string,
	referenceDate: Date = new Date(),
): boolean {
	const today = new TZDate(referenceDate, MANILA_TZ);
	today.setHours(0, 0, 0, 0);
	const other = new TZDate(iso, MANILA_TZ);
	other.setHours(0, 0, 0, 0);
	return today.getTime() >= other.getTime();
}
