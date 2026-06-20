import type { PaymentMethod } from "@/db/schema/enums";
import type { CreateBookingLedgerLine } from "@/lib/ledger/schemas";
import { createBookingLedgerLinesSchema } from "@/lib/ledger/schemas";

import type { CreateBookingFormValues } from "./schemas";
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
};

function extractFeeFields(
	values: CreateBookingFormValues | CreateBookingLedgerInput,
): { feeType: ReservationFeeType; feeValue: number } {
	// CreateBookingLedgerInput always has reservationFeeType/reservationFeeValue
	if ("reservationFeeType" in values && values.reservationFeeType != null) {
		return {
			feeType: values.reservationFeeType,
			feeValue: values.reservationFeeValue ?? 0,
		};
	}

	// CreateBookingFormValues for daily reservation
	if ("reservationFeeType" in values && "reservationFeeValue" in values) {
		const v = values as {
			reservationFeeType?: ReservationFeeType;
			reservationFeeValue?: number;
		};
		if (v.reservationFeeType != null) {
			return {
				feeType: v.reservationFeeType,
				feeValue: v.reservationFeeValue ?? 0,
			};
		}
	}

	// CreateBookingFormValues for monthly reservation
	if ("cashAdvanceType" in values && "cashAdvanceValue" in values) {
		const v = values as {
			cashAdvanceType: ReservationFeeType;
			cashAdvanceValue: number;
		};
		return { feeType: v.cashAdvanceType, feeValue: v.cashAdvanceValue };
	}

	throw new Error("Reservation fee type and value are required");
}

export function buildCreateBookingLedgerLines(
	values: CreateBookingFormValues | CreateBookingLedgerInput,
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
		// Walk-in monthly with advance deposit
		if (values.bookingType === "MONTHLY") {
			const { feeType, feeValue } = extractFeeFields(values);
			const deposit = calculateReservationFee({
				total: stayTotal,
				feeType,
				feeValue,
			});

			if (deposit > 0) {
				const balance = Math.max(0, stayTotal - deposit);
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
						isPaid: false,
						description: "Monthly room charge balance due at check-in",
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

	// Reservation - daily or monthly
	const { feeType, feeValue } = extractFeeFields(values);

	const deposit = calculateReservationFee({
		total: stayTotal,
		feeType,
		feeValue,
	});

	// Monthly reservation without advance deposit (toggle OFF)
	// Full amount due at check-in, no deposit line
	if (values.bookingType === "MONTHLY" && deposit <= 0) {
		const lines: CreateBookingLedgerLine[] = [
			{
				category: "ROOM_CHARGE",
				amount: toDecimalString(stayTotal),
				isPaid: false,
				description: "Monthly room charge due at check-in",
			},
		];
		return createBookingLedgerLinesSchema.parse(lines);
	}

	// Monthly reservation with advance deposit (2 months)
	// Deposit = 1 month rent, balance = remaining month(s) due at check-in
	if (values.bookingType === "MONTHLY" && deposit > 0) {
		const balance = Math.max(0, stayTotal - deposit);
		const lines: CreateBookingLedgerLine[] = [
			{
				category: "DEPOSIT",
				amount: toDecimalString(deposit),
				isPaid: true,
				description: "Monthly advance deposit (1 month)",
				...paymentFields,
			},
		];
		if (balance > 0) {
			lines.push({
				category: "ROOM_CHARGE",
				amount: toDecimalString(balance),
				isPaid: false,
				description: "Monthly room charge balance due at check-in",
			});
		}
		return createBookingLedgerLinesSchema.parse(lines);
	}

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
