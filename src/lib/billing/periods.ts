import { TZDate } from "@date-fns/tz";
import { formatManilaDate, MANILA_TZ } from "@/lib/date/manila";

export type MonthlyBillingPeriod = {
	index: number;
	/** Midnight (Manila) at the start of the period's first day. */
	start: string;
	/**
	 * When the period stops counting charges (exclusive): midnight (Manila)
	 * after its last day. The final period also includes the check-out day,
	 * so charges recorded while the guest leaves land on the final bill.
	 */
	end: string;
	/** First and last day of the period, e.g. "Jan 5 – Feb 4, 2026". */
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

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight in Manila at the start of the Manila day that `date` falls on. */
function startOfManilaDay(date: Date): Date {
	const manila = new TZDate(date, MANILA_TZ);
	const midnight = new TZDate(
		manila.getFullYear(),
		manila.getMonth(),
		manila.getDate(),
		0,
		0,
		0,
		MANILA_TZ,
	);
	return new Date(midnight.getTime());
}

/**
 * Midnight in Manila on the check-in day, `monthsAhead` months later. If that
 * month is shorter, the month's last day is used. Always counted from the
 * check-in day, so a stay starting on the 31st keeps returning to the 31st
 * (Feb 28, Mar 31, Apr 30, …) instead of drifting to the 28th.
 */
function periodBoundary(checkInDay: TZDate, monthsAhead: number): Date {
	const year = checkInDay.getFullYear();
	const month = checkInDay.getMonth() + monthsAhead;
	const lastDayOfMonth = new TZDate(year, month + 1, 0, MANILA_TZ).getDate();
	const day = Math.min(checkInDay.getDate(), lastDayOfMonth);
	const boundary = new TZDate(year, month, day, 0, 0, 0, MANILA_TZ);
	return new Date(boundary.getTime());
}

function formatPeriodLabel(start: Date, endExclusive: Date): string {
	const lastDay = new Date(endExclusive.getTime() - 1);
	return `${formatManilaDate(start, "MMM d")} – ${formatManilaDate(lastDay, "MMM d, yyyy")}`;
}

/**
 * Splits a monthly stay into billing periods of whole Manila days.
 *
 * A new period starts at midnight on the check-in day of each month
 * (Jan 5 – Feb 4, Feb 5 – Mar 4, …). The check-out time does not move the
 * boundaries, and the check-out day does not start a new period: it counts
 * toward the final period.
 */
export function listMonthlyBillingPeriods(
	checkIn: string,
	checkOut: string,
): MonthlyBillingPeriod[] {
	const checkInDate = new Date(checkIn);
	const checkOutDate = new Date(checkOut);

	if (
		Number.isNaN(checkInDate.getTime()) ||
		Number.isNaN(checkOutDate.getTime())
	) {
		return [];
	}

	const checkInDay = new TZDate(startOfManilaDay(checkInDate), MANILA_TZ);
	const checkOutDay = startOfManilaDay(checkOutDate);

	const periods: MonthlyBillingPeriod[] = [];

	for (let index = 0; index <= 120; index++) {
		const start = periodBoundary(checkInDay, index);
		if (start >= checkOutDay) break;

		const nextBoundary = periodBoundary(checkInDay, index + 1);
		const isFinal = nextBoundary >= checkOutDay;
		const lastDayEnd = isFinal ? checkOutDay : nextBoundary;
		const end = isFinal
			? new Date(checkOutDay.getTime() + ONE_DAY_MS)
			: nextBoundary;

		periods.push({
			index,
			start: start.toISOString(),
			end: end.toISOString(),
			label: formatPeriodLabel(start, lastDayEnd),
		});

		if (isFinal) break;
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
