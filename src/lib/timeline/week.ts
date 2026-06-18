import {
	addDays,
	format,
	getISOWeek,
	getISOWeekYear,
	isValid,
	parseISO,
	startOfWeek,
} from "date-fns";

export const WEEK_STARTS_ON = 1;

export function resolveWeekStart(weekParam?: string): string {
	if (weekParam) {
		const parsed = parseISO(weekParam);
		if (isValid(parsed)) {
			return format(
				startOfWeek(parsed, { weekStartsOn: WEEK_STARTS_ON }),
				"yyyy-MM-dd",
			);
		}
	}

	return format(
		startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }),
		"yyyy-MM-dd",
	);
}

export function getWeekDays(weekStart: string): string[] {
	const start = parseISO(weekStart);
	return Array.from({ length: 7 }, (_, index) =>
		format(addDays(start, index), "yyyy-MM-dd"),
	);
}

export function getWeekEnd(weekStart: string): string {
	return format(addDays(parseISO(weekStart), 7), "yyyy-MM-dd");
}

export function formatWeekRange(weekStart: string): string {
	const start = parseISO(weekStart);
	const end = addDays(start, 6);
	return `${format(start, "MMM d")} — ${format(end, "MMM d, yyyy")}`;
}

export function formatWeekOfYearLabel(weekStart: string): string {
	const start = parseISO(weekStart);
	return `Week ${getISOWeek(start)} · ${getISOWeekYear(start)}`;
}

export function shiftWeek(weekStart: string, deltaWeeks: number): string {
	return format(addDays(parseISO(weekStart), deltaWeeks * 7), "yyyy-MM-dd");
}

export function formatDayHeader(date: string): {
	weekday: string;
	day: string;
} {
	const parsed = parseISO(date);
	return {
		weekday: format(parsed, "EEE"),
		day: format(parsed, "d"),
	};
}

export function isToday(date: string): boolean {
	return date === format(new Date(), "yyyy-MM-dd");
}
