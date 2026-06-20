import type { PaymentMethod } from "@/db/schema/enums";
import { RESERVATION_ADVANCE_DESCRIPTION } from "@/lib/ledger/ledger.constants";
import type { CreateBookingLedgerLine } from "@/lib/ledger/schemas";
import { createBookingLedgerLinesSchema } from "@/lib/ledger/schemas";

import type { ReservationFeeType } from "./stay-pricing";
import { calculateReservationFee, toDecimalString } from "./stay-pricing";

export { createBookingLedgerLinesSchema };

export type CreateBookingLedgerInput = {
	walkIn: boolean;
	bookingType: "DAILY" | "MONTHLY";
	paymentMethod: PaymentMethod;
	referenceNumber?: string;
	reservationFeeType?: ReservationFeeType;
	reservationFeeValue?: number;
	monthlyPrice?: number;
	hasAdvance?: boolean;
};

export function buildCreateBookingLedgerLines(
	values: CreateBookingLedgerInput,
	stayTotal: number,
): CreateBookingLedgerLine[] {
	if (stayTotal <= 0) {
		throw new Error("Stay total must be greater than zero");
	}

	const paymentFields = {
		paymentMethod: values.paymentMethod,
		referenceNumber: values.referenceNumber?.trim() || undefined,
	};

	if (values.walkIn) {
		if (values.bookingType === "MONTHLY" && values.monthlyPrice) {
			const { feeType, feeValue } = getFeeFields(values);
			const deposit = calculateReservationFee({
				total: values.monthlyPrice,
				feeType,
				feeValue,
			});

			if (deposit > 0) {
				const balance = Math.max(0, values.monthlyPrice - deposit);
				const lines: CreateBookingLedgerLine[] = [
					{
						category: "DEPOSIT",
						amount: toDecimalString(deposit),
						isPaid: true,
						description: "Monthly advance deposit (walk-in)",
						...paymentFields,
					},
				];
				if (balance > 0) {
					lines.push({
						category: "ROOM_CHARGE",
						amount: toDecimalString(balance),
						isPaid: true,
						description: "Monthly room charge balance (walk-in)",
						...paymentFields,
					});
				}
				return createBookingLedgerLinesSchema.parse(lines);
			}
		}

		const lines: CreateBookingLedgerLine[] = [
			{
				category: "ROOM_CHARGE",
				amount: toDecimalString(stayTotal),
				isPaid: true,
				description:
					values.bookingType === "MONTHLY"
						? "Monthly room charge (walk-in)"
						: "Room charge (walk-in)",
				...paymentFields,
			},
		];

		return createBookingLedgerLinesSchema.parse(lines);
	}

	if (values.bookingType === "MONTHLY" && values.monthlyPrice) {
		const { feeType, feeValue } = getFeeFields(values);
		const reservationFee = calculateReservationFee({
			total: values.monthlyPrice,
			feeType,
			feeValue,
		});

		const firstMonthBalance = Math.max(0, values.monthlyPrice - reservationFee);
		const hasAdvance = values.hasAdvance === true;
		const advanceAmount = hasAdvance ? values.monthlyPrice : 0;

		const lines: CreateBookingLedgerLine[] = [];

		if (reservationFee > 0) {
			lines.push({
				category: "DEPOSIT",
				amount: toDecimalString(reservationFee),
				isPaid: true,
				description: "Monthly reservation fee",
				...paymentFields,
			});
		}

		if (firstMonthBalance > 0) {
			lines.push({
				category: "ROOM_CHARGE",
				amount: toDecimalString(firstMonthBalance),
				isPaid: false,
				description: "Room charge balance due at check-in",
			});
		}

		if (advanceAmount > 0) {
			lines.push({
				category: "ADVANCE",
				amount: toDecimalString(advanceAmount),
				isPaid: false,
				description: RESERVATION_ADVANCE_DESCRIPTION,
			});
		}

		if (lines.length === 0) {
			throw new Error("Monthly reservation must have at least one charge");
		}

		return createBookingLedgerLinesSchema.parse(lines);
	}

	const { feeType, feeValue } = getFeeFields(values);
	const deposit = calculateReservationFee({
		total: stayTotal,
		feeType,
		feeValue,
	});

	if (deposit <= 0) {
		throw new Error("Reservation deposit must be greater than zero");
	}

	if (deposit > stayTotal) {
		throw new Error("Reservation deposit cannot exceed stay total");
	}

	const balance = stayTotal - deposit;

	const lines: CreateBookingLedgerLine[] = [
		{
			category: "DEPOSIT",
			amount: toDecimalString(deposit),
			isPaid: true,
			description: "Reservation deposit",
			...paymentFields,
		},
		{
			category: "ROOM_CHARGE",
			amount: toDecimalString(balance),
			isPaid: false,
			description: "Room charge balance due at check-in",
		},
	];

	return createBookingLedgerLinesSchema.parse(lines);
}

function getFeeFields(values: CreateBookingLedgerInput): {
	feeType: ReservationFeeType;
	feeValue: number;
} {
	if (values.reservationFeeType != null) {
		return {
			feeType: values.reservationFeeType,
			feeValue: values.reservationFeeValue ?? 0,
		};
	}
	throw new Error("Reservation fee type and value are required");
}
