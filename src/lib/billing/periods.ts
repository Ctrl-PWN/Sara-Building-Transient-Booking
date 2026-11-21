import { TZDate } from "@date-fns/tz";
import { formatManilaDate, MANILA_TZ } from "@/lib/date/manila";

export type MonthlyBillingPeriod = {
	index: number;
	start: string;
	end: string;
	label: string;
};

const PERIOD_END_HOUR = 12;

function periodEnd(checkIn: TZDate, monthsAhead: number): Date {
	const year = checkIn.getFullYear();
	const month = checkIn.getMonth() + monthsAhead;
	const lastDayOfMonth = new TZDate(year, month + 1, 0, MANILA_TZ).getDate();
	const day = Math.min(checkIn.getDate(), lastDayOfMonth);
	const end = new TZDate(year, month, day, PERIOD_END_HOUR, 0, 0, MANILA_TZ);
	// Plain Date, so toISOString() gives UTC ("…Z") like the stored values.
	return new Date(end.getTime());
}

function formatPeriodLabel(start: Date, end: Date): string {
	return `${formatManilaDate(start, "MMM d")} – ${formatManilaDate(end, "MMM d, yyyy")}`;
}

export function listMonthlyBillingPeriods(
	checkIn: string,
	checkOut: string,
): MonthlyBillingPeriod[] {
	const checkInDate = new TZDate(checkIn, MANILA_TZ);
	const finalCheckOut = new Date(checkOut);

	if (
		Number.isNaN(checkInDate.getTime()) ||
		Number.isNaN(finalCheckOut.getTime())
	) {
		return [];
	}

	const periods: MonthlyBillingPeriod[] = [];
	let periodStart = new Date(checkInDate.getTime());

	for (let index = 0; periodStart < finalCheckOut && index <= 120; index++) {
		const end = periodEnd(checkInDate, index + 1);
		const boundedEnd = end > finalCheckOut ? finalCheckOut : end;

		periods.push({
			index,
			start: periodStart.toISOString(),
			end: boundedEnd.toISOString(),
			label: formatPeriodLabel(periodStart, boundedEnd),
		});

		periodStart = boundedEnd;
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
