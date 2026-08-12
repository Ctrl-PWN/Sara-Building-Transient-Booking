import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { MANILA_TZ } from "@/lib/date/manila";

export type MonthlyBillingPeriod = {
	index: number;
	start: string;
	end: string;
	label: string;
};

type PeriodAssignedTransaction = {
	billingPeriodIndex: number | null;
	createdAt: string;
};

/** Advance one billing month from a checkout anchor (same rules as extend booking). */
export function addMonthlyPeriodEnd(date: Date): Date {
	const manilaDate = new TZDate(date, MANILA_TZ);
	const targetMonth = manilaDate.getMonth() + 1;
	const targetYear = manilaDate.getFullYear();
	const lastDayOfMonth = new TZDate(
		targetYear,
		targetMonth + 1,
		0,
		0,
		0,
		0,
		MANILA_TZ,
	).getDate();
	const day = Math.min(manilaDate.getDate(), lastDayOfMonth);

	return new TZDate(
		targetYear,
		targetMonth,
		day,
		manilaDate.getHours(),
		manilaDate.getMinutes(),
		manilaDate.getSeconds(),
		manilaDate.getMilliseconds(),
		MANILA_TZ,
	);
}

function formatPeriodLabel(start: Date, end: Date): string {
	return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function listMonthlyBillingPeriods(
	checkIn: string,
	checkOut: string,
): MonthlyBillingPeriod[] {
	const checkInDate = new TZDate(checkIn, MANILA_TZ);
	const finalCheckOut = new TZDate(checkOut, MANILA_TZ);

	if (
		Number.isNaN(checkInDate.getTime()) ||
		Number.isNaN(finalCheckOut.getTime())
	) {
		return [];
	}

	const periods: MonthlyBillingPeriod[] = [];
	let periodStart: Date = checkInDate;
	let index = 0;

	while (periodStart < finalCheckOut) {
		const periodEnd = addMonthlyPeriodEnd(periodStart);
		const boundedEnd = periodEnd > finalCheckOut ? finalCheckOut : periodEnd;

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

export function isTransactionWithinPeriod(
	transaction: PeriodAssignedTransaction,
	period: MonthlyBillingPeriod,
): boolean {
	if (transaction.billingPeriodIndex != null) {
		return transaction.billingPeriodIndex === period.index;
	}

	return isWithinPeriod(transaction.createdAt, period);
}
