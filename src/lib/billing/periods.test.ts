import { describe, expect, it } from "vitest";
import {
	isWithinPeriod,
	listMonthlyBillingPeriods,
	type MonthlyBillingPeriod,
} from "@/lib/billing/periods";
import { formatManilaDate, manilaWallClockToInstant } from "@/lib/date/manila";

/** Manila wall-clock time → ISO instant, e.g. m("2026-01-31T14:00"). */
const m = (wallClock: string) => manilaWallClockToInstant(wallClock);

/** Each period's end as Manila wall-clock time, for readable assertions. */
const ends = (periods: MonthlyBillingPeriod[]) =>
	periods.map((p) => formatManilaDate(p.end, "yyyy-MM-dd HH:mm"));

describe("listMonthlyBillingPeriods", () => {
	it("splits a normal stay into monthly periods ending at noon Manila", () => {
		const periods = listMonthlyBillingPeriods(
			m("2026-03-05T14:00"),
			m("2026-06-05T12:00"),
		);

		expect(ends(periods)).toEqual([
			"2026-04-05 12:00",
			"2026-05-05 12:00",
			"2026-06-05 12:00",
		]);
		expect(periods.map((p) => p.index)).toEqual([0, 1, 2]);
	});

	it("starts at check-in, and each period starts where the last one ended", () => {
		const checkIn = m("2026-03-05T14:00");
		const periods = listMonthlyBillingPeriods(checkIn, m("2026-06-05T12:00"));

		expect(periods[0].start).toBe(checkIn);
		expect(periods[1].start).toBe(periods[0].end);
		expect(periods[2].start).toBe(periods[1].end);
	});

	it("crosses into the next year", () => {
		const periods = listMonthlyBillingPeriods(
			m("2026-12-15T14:00"),
			m("2027-02-15T12:00"),
		);

		expect(ends(periods)).toEqual(["2027-01-15 12:00", "2027-02-15 12:00"]);
	});

	it("cuts the last period short at check-out", () => {
		const periods = listMonthlyBillingPeriods(
			m("2026-03-05T14:00"),
			m("2026-04-20T12:00"),
		);

		expect(ends(periods)).toEqual(["2026-04-05 12:00", "2026-04-20 12:00"]);
	});

	describe("start days on the 29th–31st", () => {
		it("31st: shortens to the month's last day, then returns to the 31st", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-31T14:00"),
				m("2026-05-31T12:00"),
			);

			expect(ends(periods)).toEqual([
				"2026-02-28 12:00",
				"2026-03-31 12:00",
				"2026-04-30 12:00",
				"2026-05-31 12:00",
			]);
		});

		it("30th: shortens in February, then returns to the 30th", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-30T14:00"),
				m("2026-04-30T12:00"),
			);

			expect(ends(periods)).toEqual([
				"2026-02-28 12:00",
				"2026-03-30 12:00",
				"2026-04-30 12:00",
			]);
		});

		it("29th in a normal year: Feb 28, then back to the 29th", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-29T14:00"),
				m("2026-03-29T12:00"),
			);

			expect(ends(periods)).toEqual(["2026-02-28 12:00", "2026-03-29 12:00"]);
		});

		it("29th in a leap year: Feb 29", () => {
			const periods = listMonthlyBillingPeriods(
				m("2028-01-29T14:00"),
				m("2028-03-29T12:00"),
			);

			expect(ends(periods)).toEqual(["2028-02-29 12:00", "2028-03-29 12:00"]);
		});
	});

	describe("Manila timezone", () => {
		it("uses the Manila day for an early-morning check-in (still the day before in UTC)", () => {
			// Feb 1, 02:00 in Manila is Jan 31, 18:00 UTC.
			const periods = listMonthlyBillingPeriods(
				m("2026-02-01T02:00"),
				m("2026-04-01T12:00"),
			);

			expect(ends(periods)).toEqual(["2026-03-01 12:00", "2026-04-01 12:00"]);
		});

		it("labels periods with Manila dates", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-02-01T02:00"),
				m("2026-04-01T12:00"),
			);

			expect(periods[0].label).toBe("Feb 1 – Mar 1, 2026");
		});
	});

	describe("bad input", () => {
		it("returns no periods for invalid dates", () => {
			expect(
				listMonthlyBillingPeriods("not a date", m("2026-04-01T12:00")),
			).toEqual([]);
		});

		it("returns no periods when check-out is not after check-in", () => {
			const day = m("2026-03-05T14:00");
			expect(listMonthlyBillingPeriods(day, day)).toEqual([]);
		});
	});
});

describe("isWithinPeriod", () => {
	const period: MonthlyBillingPeriod = {
		index: 0,
		start: m("2026-03-05T14:00"),
		end: m("2026-04-05T12:00"),
		label: "",
	};

	it("includes the exact start", () => {
		expect(isWithinPeriod(period.start, period)).toBe(true);
	});

	it("includes a time inside the period", () => {
		expect(isWithinPeriod(m("2026-03-20T09:00"), period)).toBe(true);
	});

	it("excludes the exact end (it belongs to the next period)", () => {
		expect(isWithinPeriod(period.end, period)).toBe(false);
	});

	it("excludes a time before the start", () => {
		expect(isWithinPeriod(m("2026-03-05T13:59"), period)).toBe(false);
	});
});
