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

/**
 * Turns a naive Manila wall-clock datetime string (e.g. "2026-07-16T20:00",
 * no timezone offset) into the correct UTC instant as an ISO string.
 *
 * Naive strings coming from the booking form mean "this time in Manila". Parsing
 * them with `new Date()` would interpret them in the server's timezone (UTC),
 * shifting the stored instant by 8 hours and rolling evening times to the next
 * calendar day when displayed back in Manila. This builds the instant from the
 * date/time components *in* Asia/Manila instead.
 *
 * Idempotent on strings that already carry an offset or `Z` — those are already
 * absolute instants and are just normalized.
 */
export function manilaWallClockToInstant(value: string): string {
	if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) {
		return new Date(value).toISOString();
	}
	const [datePart, timePart = "00:00"] = value.split("T");
	const [y, mo, d] = datePart.split("-").map(Number);
	const [h, mi = 0, s = 0] = timePart.split(":").map(Number);
	const tz = new TZDate(y, mo - 1, d, h, mi, s, MANILA_TZ);
	return new Date(tz.getTime()).toISOString();
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

export function formatManilaDateTime(
	date: Date | string | number,
	dateFormat = "MMM d, yyyy h:mm a",
): string {
	return formatManilaDate(date, dateFormat);
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
