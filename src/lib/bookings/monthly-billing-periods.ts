import { format } from "date-fns";

export type MonthlyBillingPeriod = {
	index: number;
	start: string;
	end: string;
	label: string;
};

/** Advance one billing month from a checkout anchor (same rules as extend booking). */
export function addMonthlyPeriodEnd(date: Date): Date {
	const targetMonth = date.getMonth() + 1;
	const targetYear = date.getFullYear();
	const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
	const day = Math.min(date.getDate(), lastDayOfMonth);
	return new Date(targetYear, targetMonth, day, 12, 0, 0);
}

function formatPeriodLabel(start: Date, end: Date): string {
	return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function listMonthlyBillingPeriods(
	checkIn: string,
	checkOut: string,
): MonthlyBillingPeriod[] {
	const checkInDate = new Date(checkIn);
	const finalCheckOut = new Date(checkOut);

	if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(finalCheckOut.getTime())) {
		return [];
	}

	const periods: MonthlyBillingPeriod[] = [];
	let periodStart = checkInDate;
	let index = 0;

	while (periodStart < finalCheckOut) {
		const periodEnd = addMonthlyPeriodEnd(periodStart);
		const boundedEnd =
			periodEnd > finalCheckOut ? finalCheckOut : periodEnd;

		periods.push({
			index,
			start: periodStart.toISOString(),
			end: boundedEnd.toISOString(),
			label: formatPeriodLabel(periodStart, boundedEnd),
		});

		periodStart = boundedEnd;
		index += 1;

		if (periodStart >= finalCheckOut) break;
		if (index > 120) break;
	}

	return periods;
}

export function getLatestPeriodIndex(periods: MonthlyBillingPeriod[]): number {
	if (periods.length === 0) return 0;
	return periods.length - 1;
}

export function isWithinPeriod(
	createdAt: string,
	period: MonthlyBillingPeriod,
): boolean {
	const ts = new Date(createdAt).getTime();
	const start = new Date(period.start).getTime();
	const end = new Date(period.end).getTime();
	return ts >= start && ts < end;
}
