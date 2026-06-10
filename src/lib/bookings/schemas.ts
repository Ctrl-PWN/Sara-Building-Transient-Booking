import { z } from "zod";

import { bookingPaymentStatusEnum, bookingStatusEnum } from "@/db/schema/enums";
import {
	ledgerPaymentFieldsShape,
	paymentMethodSchema,
	paymentReferenceRefine,
} from "@/lib/ledger/schemas";

export { paymentMethodSchema };

export const bookingStatusSchema = z.enum(bookingStatusEnum.enumValues);
export const bookingPaymentStatusSchema = z.enum(
	bookingPaymentStatusEnum.enumValues,
);

export const reservationFeeTypeSchema = z.enum(["PERCENT", "FIXED"]);

export const bookingByIdSchema = z.object({
	id: z.number().int().positive(),
});

export const timelineSearchSchema = z.object({
	week: z.string().optional(),
});

const dateRangeRefine = {
	check: (data: { checkInDate: string; checkOutDate: string }) =>
		!data.checkInDate ||
		!data.checkOutDate ||
		new Date(data.checkOutDate) >= new Date(data.checkInDate),
	message: "Check-out cannot be before check-in date" as const,
	path: ["checkOutDate"] as const,
};

export const createBookingStayFieldsShape = {
	roomId: z.string().min(1, "Room is required"),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	contactNumber: z.string().optional(),
	address: z.string().min(1, "Address is required"),
	checkInDate: z.string().min(1, "Check-in date is required"),
	checkOutDate: z.string().min(1, "Check-out date is required"),
	occupantsCount: z.number().int().min(1, "At least 1 occupant required"),
} as const;

const reservationFeeRefine = (
	data: {
		reservationFeeType: z.infer<typeof reservationFeeTypeSchema>;
		reservationFeeValue: number;
	},
	ctx: z.RefinementCtx,
) => {
	if (data.reservationFeeType === "PERCENT") {
		if (data.reservationFeeValue > 100) {
			ctx.addIssue({
				code: "custom",
				message: "Percentage fee cannot exceed 100%",
				path: ["reservationFeeValue"],
			});
		}
		return;
	}

	if (data.reservationFeeValue <= 0) {
		ctx.addIssue({
			code: "custom",
			message: "Fixed fee must be greater than 0",
			path: ["reservationFeeValue"],
		});
	}
};

const walkInBookingFormSchema = z
	.object({
		...createBookingStayFieldsShape,
		walkIn: z.literal(true),
		...ledgerPaymentFieldsShape,
	})
	.refine(dateRangeRefine.check, {
		message: dateRangeRefine.message,
		path: [dateRangeRefine.path[0]],
	})
	.superRefine(paymentReferenceRefine);

const reservationBookingFormSchema = z
	.object({
		...createBookingStayFieldsShape,
		walkIn: z.literal(false),
		reservationFeeType: reservationFeeTypeSchema,
		reservationFeeValue: z.number().min(0, "Fee must be 0 or greater"),
		...ledgerPaymentFieldsShape,
	})
	.refine(dateRangeRefine.check, {
		message: dateRangeRefine.message,
		path: [dateRangeRefine.path[0]],
	})
	.superRefine(paymentReferenceRefine)
	.superRefine(reservationFeeRefine);

export const createBookingFormSchema = z.discriminatedUnion("walkIn", [
	walkInBookingFormSchema,
	reservationBookingFormSchema,
]);

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

const createBookingStayDefaultValues = () => {
	return {
		roomId: "",
		firstName: "",
		lastName: "",
		contactNumber: "",
		address: "",
		checkInDate: "",
		checkOutDate: "",
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
		};
	}

	return {
		...stay,
		walkIn: false,
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
		address: z.string().min(1, "Address is required"),
		checkInDate: z.string().min(1, "Check-in date is required"),
		checkOutDate: z.string().min(1, "Check-out date is required"),
		occupantsCount: z.number().int().positive("At least 1 occupant required"),
		walkIn: z.boolean(),
		paymentMethod: paymentMethodSchema,
		referenceNumber: z.string().optional(),
		reservationFeeType: reservationFeeTypeSchema.optional(),
		reservationFeeValue: z.number().min(0).optional(),
		depositPercentage: z.number().min(0).max(100),
	})
	.refine((data) => new Date(data.checkOutDate) >= new Date(data.checkInDate), {
		message: "Check-out cannot be before check-in date",
		path: ["checkOutDate"],
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
