import { differenceInCalendarDays, format } from "date-fns";

import { nowInManila, startOfDayInManila } from "@/lib/date/manila";

export type LateFeePreview = {
	daysOverdue: number;
	amount: number;
	rate: number;
	description: string;
};

function toManilaDateKey(value: string | Date | number): string {
	if (value instanceof Date) {
		return format(value, "yyyy-MM-dd");
	}
	if (typeof value === "number") {
		return format(new Date(value), "yyyy-MM-dd");
	}
	const tz = new Date(value);
	if (Number.isNaN(tz.getTime())) return value;
	return format(tz, "yyyy-MM-dd");
}

export function computeLateFee(args: {
	checkOut: string | Date;
	roomBasePrice: string | number;
	now?: Date;
}): LateFeePreview | null {
	const rate = Number(args.roomBasePrice);
	if (!Number.isFinite(rate) || rate <= 0) return null;

	const nowKey = args.now
		? format(args.now, "yyyy-MM-dd")
		: format(nowInManila(), "yyyy-MM-dd");
	const checkOutKey = toManilaDateKey(args.checkOut);

	const today = startOfDayInManila(nowKey);
	const scheduled = startOfDayInManila(checkOutKey);

	const daysOverdue = differenceInCalendarDays(today, scheduled);
	if (daysOverdue <= 0) return null;

	const amount = daysOverdue * rate;
	return {
		daysOverdue,
		amount,
		rate,
		description: `Late checkout: ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
	};
}
