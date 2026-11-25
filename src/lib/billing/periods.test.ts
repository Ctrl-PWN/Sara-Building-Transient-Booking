import { describe, expect, it } from "vitest";
import {
	isTransactionWithinPeriod,
	isWithinPeriod,
	listMonthlyBillingPeriods,
	type MonthlyBillingPeriod,
} from "@/lib/billing/periods";
import { formatManilaDate, manilaWallClockToInstant } from "@/lib/date/manila";

/** Manila wall-clock time → ISO instant, e.g. m("2026-01-31T14:00"). */
const m = (wallClock: string) => manilaWallClockToInstant(wallClock);

/** Each period's start as Manila wall-clock time. */
const starts = (periods: MonthlyBillingPeriod[]) =>
	periods.map((p) => formatManilaDate(p.start, "yyyy-MM-dd HH:mm"));

const labels = (periods: MonthlyBillingPeriod[]) => periods.map((p) => p.label);

describe("listMonthlyBillingPeriods", () => {
	it("splits a stay into whole-day monthly periods starting at midnight Manila", () => {
		const periods = listMonthlyBillingPeriods(
			m("2026-01-05T14:00"),
			m("2026-04-05T11:00"),
		);

		expect(labels(periods)).toEqual([
			"Jan 5 – Feb 4, 2026",
			"Feb 5 – Mar 4, 2026",
			"Mar 5 – Apr 4, 2026",
		]);
		expect(starts(periods)).toEqual([
			"2026-01-05 00:00",
			"2026-02-05 00:00",
			"2026-03-05 00:00",
		]);
		expect(periods.map((p) => p.index)).toEqual([0, 1, 2]);
	});

	it("starts each period where the previous one ended", () => {
		const periods = listMonthlyBillingPeriods(
			m("2026-01-05T14:00"),
			m("2026-04-05T11:00"),
		);

		expect(periods[1].start).toBe(periods[0].end);
		expect(periods[2].start).toBe(periods[1].end);
	});

	it("crosses into the next year", () => {
		const periods = listMonthlyBillingPeriods(
			m("2026-12-15T14:00"),
			m("2027-02-15T11:00"),
		);

		expect(labels(periods)).toEqual([
			"Dec 15 – Jan 14, 2027",
			"Jan 15 – Feb 14, 2027",
		]);
	});

	describe("check-out", () => {
		it("does not start a new period on the check-out day, whatever the time", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-05T14:00"),
				m("2026-04-05T23:00"),
			);

			expect(periods).toHaveLength(3);
		});

		it("ends the last period the day before an early check-out", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-05T14:00"),
				m("2026-02-20T11:00"),
			);

			expect(labels(periods)).toEqual([
				"Jan 5 – Feb 4, 2026",
				"Feb 5 – Feb 19, 2026",
			]);
		});

		it("counts charges recorded on the check-out day in the last period", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-05T14:00"),
				m("2026-04-05T11:00"),
			);
			const last = periods[2];

			expect(isWithinPeriod(m("2026-04-05T10:30"), last)).toBe(true);
			expect(isWithinPeriod(m("2026-04-05T23:59"), last)).toBe(true);
			expect(isWithinPeriod(m("2026-04-06T00:00"), last)).toBe(false);
		});
	});

	describe("start days on the 29th–31st", () => {
		it("31st: uses the month's last day when shorter, then returns to the 31st", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-31T14:00"),
				m("2026-05-31T11:00"),
			);

			expect(labels(periods)).toEqual([
				"Jan 31 – Feb 27, 2026",
				"Feb 28 – Mar 30, 2026",
				"Mar 31 – Apr 29, 2026",
				"Apr 30 – May 30, 2026",
			]);
		});

		it("30th: shortens around February, then returns to the 30th", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-30T14:00"),
				m("2026-04-30T11:00"),
			);

			expect(labels(periods)).toEqual([
				"Jan 30 – Feb 27, 2026",
				"Feb 28 – Mar 29, 2026",
				"Mar 30 – Apr 29, 2026",
			]);
		});

		it("29th in a normal year: Feb 28, then back to the 29th", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-29T14:00"),
				m("2026-03-29T11:00"),
			);

			expect(labels(periods)).toEqual([
				"Jan 29 – Feb 27, 2026",
				"Feb 28 – Mar 28, 2026",
			]);
		});

		it("29th in a leap year: Feb 29", () => {
			const periods = listMonthlyBillingPeriods(
				m("2028-01-29T14:00"),
				m("2028-03-29T11:00"),
			);

			expect(labels(periods)).toEqual([
				"Jan 29 – Feb 28, 2028",
				"Feb 29 – Mar 28, 2028",
			]);
		});
	});

	describe("Manila timezone", () => {
		it("uses the Manila day for an early-morning check-in (still the day before in UTC)", () => {
			// Feb 1, 02:00 in Manila is Jan 31, 18:00 UTC.
			const periods = listMonthlyBillingPeriods(
				m("2026-02-01T02:00"),
				m("2026-04-01T11:00"),
			);

			expect(labels(periods)).toEqual([
				"Feb 1 – Feb 28, 2026",
				"Mar 1 – Mar 31, 2026",
			]);
			expect(starts(periods)[0]).toBe("2026-02-01 00:00");
		});

		it("moves to the next period at midnight Manila", () => {
			const periods = listMonthlyBillingPeriods(
				m("2026-01-05T14:00"),
				m("2026-04-05T11:00"),
			);

			expect(isWithinPeriod(m("2026-02-04T23:59"), periods[0])).toBe(true);
			expect(isWithinPeriod(m("2026-02-05T00:00"), periods[0])).toBe(false);
			expect(isWithinPeriod(m("2026-02-05T00:00"), periods[1])).toBe(true);
		});
	});

	describe("bad input", () => {
		it("returns no periods for invalid dates", () => {
			expect(
				listMonthlyBillingPeriods("not a date", m("2026-04-01T11:00")),
			).toEqual([]);
		});

		it("returns no periods when check-out is on the check-in day", () => {
			expect(
				listMonthlyBillingPeriods(m("2026-03-05T08:00"), m("2026-03-05T20:00")),
			).toEqual([]);
		});
	});
});

describe("isTransactionWithinPeriod", () => {
	const periods = listMonthlyBillingPeriods(
		m("2026-01-05T14:00"),
		m("2026-04-05T11:00"),
	);

	it("uses the stored period index when there is one", () => {
		const advance = { billingPeriodIndex: 2, createdAt: m("2026-01-05T15:00") };

		expect(isTransactionWithinPeriod(advance, periods[2])).toBe(true);
		expect(isTransactionWithinPeriod(advance, periods[0])).toBe(false);
	});

	it("falls back to the recorded date when there is no index", () => {
		const charge = {
			billingPeriodIndex: null,
			createdAt: m("2026-02-10T09:00"),
		};

		expect(isTransactionWithinPeriod(charge, periods[1])).toBe(true);
		expect(isTransactionWithinPeriod(charge, periods[0])).toBe(false);
	});
});
