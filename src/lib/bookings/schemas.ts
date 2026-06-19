import { z } from "zod";

import {
	bookingPaymentStatusEnum,
	bookingStatusEnum,
	bookingTypeEnum,
} from "@/db/schema/enums";
import {
	ledgerPaymentFieldsShape,
	paymentMethodSchema,
	paymentReferenceRefine,
	utilityExpenseItemsSchema,
} from "@/lib/ledger/schemas";

export { paymentMethodSchema };

export const bookingStatusSchema = z.enum(bookingStatusEnum.enumValues);
export const bookingPaymentStatusSchema = z.enum(
	bookingPaymentStatusEnum.enumValues,
);
export const bookingTypeSchema = z.enum(bookingTypeEnum.enumValues);

export const reservationFeeTypeSchema = z.enum(["PERCENT", "FIXED"]);

export const bookingByIdSchema = z.object({
	id: z.number().int().positive(),
});

export const timelineSearchSchema = z.object({
	week: z.string().optional(),
});

export const createBookingFormSchema = z
	.object({
		roomId: z.string().min(1, "Room is required"),
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		contactNumber: z.string(),
		address: z.string().optional(),
		occupantsCount: z.number().int().min(1, "At least 1 occupant required"),
		bookingType: z.enum(["DAILY", "MONTHLY"]),
		walkIn: z.boolean(),
		// Daily fields
		checkInDate: z.string(),
		checkOutDate: z.string(),
		checkInTime: z.string(),
		checkOutTime: z.string(),
		// Daily reservation
		reservationFeeType: reservationFeeTypeSchema.optional(),
		reservationFeeValue: z.number().min(0).optional(),
		// Monthly cash advance
		cashAdvanceType: reservationFeeTypeSchema.optional(),
		cashAdvanceValue: z.number().min(0).optional(),
		// Payment
		...ledgerPaymentFieldsShape,
	})
	.superRefine((data, ctx) => {
		if (data.bookingType === "DAILY" && !data.walkIn) {
			// Reservation daily - validate date range
			if (
				data.checkInDate &&
				data.checkOutDate &&
				!(new Date(data.checkOutDate) > new Date(data.checkInDate)) &&
				!(
					data.checkInDate === data.checkOutDate &&
					data.checkOutTime > data.checkInTime
				)
			) {
				ctx.addIssue({
					code: "custom",
					message: "Check-out cannot be before check-in",
					path: ["checkOutDate"],
				});
			}
			// Validate reservation fee
			if (data.reservationFeeType == null) {
				ctx.addIssue({
					code: "custom",
					message: "Reservation fee type is required",
					path: ["reservationFeeType"],
				});
			}
			if (data.reservationFeeValue == null || data.reservationFeeValue < 0) {
				ctx.addIssue({
					code: "custom",
					message: "Reservation fee value is required",
					path: ["reservationFeeValue"],
				});
			}
			if (
				data.reservationFeeType === "PERCENT" &&
				data.reservationFeeValue != null &&
				data.reservationFeeValue > 100
			) {
				ctx.addIssue({
					code: "custom",
					message: "Percentage fee cannot exceed 100%",
					path: ["reservationFeeValue"],
				});
			}
		}

		if (data.bookingType === "DAILY" && data.walkIn) {
			// Walk-in daily - validate date range
			if (
				data.checkInDate &&
				data.checkOutDate &&
				!(new Date(data.checkOutDate) > new Date(data.checkInDate)) &&
				!(
					data.checkInDate === data.checkOutDate &&
					data.checkOutTime > data.checkInTime
				)
			) {
				ctx.addIssue({
					code: "custom",
					message: "Check-out cannot be before check-in",
					path: ["checkOutDate"],
				});
			}
		}

		if (data.bookingType === "MONTHLY" && !data.walkIn) {
			// Reservation monthly - validate date fields
			if (!data.checkInDate) {
				ctx.addIssue({
					code: "custom",
					message: "Check-in date is required",
					path: ["checkInDate"],
				});
			}
			// Validate cash advance if provided
			if (
				data.cashAdvanceType === "PERCENT" &&
				data.cashAdvanceValue != null &&
				data.cashAdvanceValue > 100
			) {
				ctx.addIssue({
					code: "custom",
					message: "Percentage cash advance cannot exceed 100%",
					path: ["cashAdvanceValue"],
				});
			}
		}

		if (data.bookingType === "MONTHLY" && data.walkIn) {
			// Walk-in monthly
			if (!data.checkInDate) {
				ctx.addIssue({
					code: "custom",
					message: "Check-in date is required",
					path: ["checkInDate"],
				});
			}
		}

		// Payment reference validation
		if (
			(data.paymentMethod === "GCASH" ||
				data.paymentMethod === "BANK_TRANSFER") &&
			!data.referenceNumber?.trim()
		) {
			ctx.addIssue({
				code: "custom",
				message: "Reference number is required for this payment method",
				path: ["referenceNumber"],
			});
		}
	});

export type CreateBookingFormValues = z.infer<typeof createBookingFormSchema>;

export function formatIsoDate(date: Date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function todayIsoDate() {
	return formatIsoDate(new Date());
}

function currentTimeHHMM() {
	const now = new Date();
	const h = String(now.getHours()).padStart(2, "0");
	const m = String(now.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
}

const createBookingStayDefaultValues = () => {
	return {
		roomId: "",
		firstName: "",
		lastName: "",
		contactNumber: "",
		address: "",
		occupantsCount: 2,
		paymentMethod: "CASH" as const,
		referenceNumber: "",
	};
};

export function createBookingFormDefaultValues(
	walkIn: boolean,
): CreateBookingFormValues {
	const stay = createBookingStayDefaultValues();

	if (walkIn) {
		return {
			...stay,
			walkIn: true,
			bookingType: "DAILY",
			checkInDate: todayIsoDate(),
			checkOutDate: "",
			checkInTime: currentTimeHHMM(),
			checkOutTime: "14:00",
		};
	}

	return {
		...stay,
		walkIn: false,
		bookingType: "DAILY",
		checkInDate: "",
		checkOutDate: "",
		checkInTime: currentTimeHHMM(),
		checkOutTime: "14:00",
		reservationFeeType: "PERCENT",
		reservationFeeValue: 20,
	};
}

// Realigned with createBookingFormSchema in a follow-up server-fn step.
export const createBookingServerSchema = z
	.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		roomId: z.number().int().positive("Room is required"),
		contactNumber: z.string().optional(),
		address: z.string().optional(),
		checkIn: z.string().min(1, "Check-in date is required"),
		checkOut: z.string().min(1, "Check-out date is required"),
		occupantsCount: z.number().int().positive("At least 1 occupant required"),
		walkIn: z.boolean(),
		bookingType: bookingTypeSchema,
		paymentMethod: paymentMethodSchema,
		referenceNumber: z.string().optional(),
		reservationFeeType: reservationFeeTypeSchema.optional(),
		reservationFeeValue: z.number().min(0).optional(),
		depositPercentage: z.number().min(0).max(100),
	})
	.refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
		message: "Check-out cannot be before check-in",
		path: ["checkOut"],
	})
	.superRefine((data, ctx) => {
		if (
			(data.paymentMethod === "GCASH" ||
				data.paymentMethod === "BANK_TRANSFER") &&
			!data.referenceNumber?.trim()
		) {
			ctx.addIssue({
				code: "custom",
				message: "Reference number is required for this payment method",
				path: ["referenceNumber"],
			});
		}
		if (!data.walkIn) {
			if (!data.reservationFeeType) {
				ctx.addIssue({
					code: "custom",
					message: "Reservation fee type is required",
					path: ["reservationFeeType"],
				});
			}
			if (data.reservationFeeValue == null) {
				ctx.addIssue({
					code: "custom",
					message: "Reservation fee value is required",
					path: ["reservationFeeValue"],
				});
			}
		}
	});

export const updateStatusSchema = z.object({
	bookingRef: z.string().min(1),
	status: bookingStatusSchema,
	cancellationReason: z.string().optional(),
	evictionReason: z.string().optional(),
});

export const checkInBookingSchema = z
	.object({
		bookingRef: z.string().min(1, "Booking reference is required"),
		...ledgerPaymentFieldsShape,
	})
	.superRefine(paymentReferenceRefine);

export const checkOutBookingSchema = z.object({
	bookingRef: z.string().min(1, "Booking reference is required"),
});

export const transferBookingSchema = z.object({
	bookingRef: z.string().min(1, "Booking reference is required"),
	targetRoomId: z.number().int().positive("Target room is required"),
	reason: z.string().min(1, "Transfer reason is required"),
});

export const extendBookingSchema = z
	.object({
		bookingRef: z.string().min(1, "Booking reference is required"),
		withCashAdvance: z.boolean(),
		...ledgerPaymentFieldsShape,
		utilities: utilityExpenseItemsSchema.optional().default([]),
	})
	.superRefine((data, ctx) => {
		paymentReferenceRefine(
			{
				paymentMethod: data.paymentMethod,
				referenceNumber: data.referenceNumber,
			},
			ctx,
		);
	});
