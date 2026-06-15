import { z } from "zod";

import {
	ledgerTransactionCategoryEnum,
	paymentMethodEnum,
} from "@/db/schema/enums";

export const ledgerTransactionCategorySchema = z.enum(
	ledgerTransactionCategoryEnum.enumValues,
);
export const paymentMethodSchema = z.enum(paymentMethodEnum.enumValues);

export const paymentReferenceRefine = (
	data: {
		paymentMethod: z.infer<typeof paymentMethodSchema>;
		referenceNumber?: string;
	},
	ctx: z.RefinementCtx,
) => {
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
};

export const ledgerPaymentFieldsShape = {
	paymentMethod: paymentMethodSchema,
	referenceNumber: z.string(),
} as const;

export const ledgerPaymentFieldsSchema = z
	.object(ledgerPaymentFieldsShape)
	.superRefine(paymentReferenceRefine);

export const createBookingLedgerCategorySchema = z.enum([
	"ROOM_CHARGE",
	"DEPOSIT",
]);

export const createBookingLedgerLineSchema = z
	.object({
		category: createBookingLedgerCategorySchema,
		amount: z.string().min(1, "Amount is required"),
		isPaid: z.boolean(),
		description: z.string().optional(),
		paymentMethod: paymentMethodSchema.optional(),
		referenceNumber: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (!data.isPaid) return;

		if (!data.paymentMethod) {
			ctx.addIssue({
				code: "custom",
				message: "Payment method is required for paid transactions",
				path: ["paymentMethod"],
			});
			return;
		}

		paymentReferenceRefine(
			{
				paymentMethod: data.paymentMethod,
				referenceNumber: data.referenceNumber,
			},
			ctx,
		);
	});

export type CreateBookingLedgerLine = z.infer<
	typeof createBookingLedgerLineSchema
>;

export const createBookingLedgerLinesSchema = z.array(
	createBookingLedgerLineSchema,
);

export function chargeWithPaymentRefine(
	data: {
		isPaid?: boolean;
		paymentMethod?: z.infer<typeof paymentMethodSchema>;
		referenceNumber?: string;
	},
	ctx: z.RefinementCtx,
) {
	if (!data.isPaid) return;

	if (!data.paymentMethod) {
		ctx.addIssue({
			code: "custom",
			message: "Payment method is required for paid transactions",
			path: ["paymentMethod"],
		});
		return;
	}

	paymentReferenceRefine(
		{
			paymentMethod: data.paymentMethod,
			referenceNumber: data.referenceNumber,
		},
		ctx,
	);
}

export const addExpenseFormSchema = z
	.object({
		amount: z.number().positive("Amount must be greater than zero"),
		description: z.string().min(1, "Description is required"),
		isPaid: z.boolean(),
		paymentMethod: paymentMethodSchema.optional(),
		referenceNumber: z.string().optional(),
	})
	.superRefine(chargeWithPaymentRefine);

export const createExpenseSchema = z
	.object({
		bookingId: z.number().int().positive(),
		amount: z.number().positive("Amount must be greater than zero"),
		description: z.string().min(1, "Description is required"),
		isPaid: z.boolean().optional(),
		paymentMethod: paymentMethodSchema.optional(),
		referenceNumber: z.string().optional(),
	})
	.superRefine(chargeWithPaymentRefine);

const payExpenseItemSchema = z
	.object({
		id: z.number().int().positive(),
		...ledgerPaymentFieldsShape,
	})
	.superRefine(paymentReferenceRefine);

export const payExpensesSchema = z.object({
	bookingId: z.number().int().positive(),
	items: z.array(payExpenseItemSchema).min(1, "At least one item is required"),
});

export const payExpensesBulkSchema = z
	.object({
		bookingId: z.number().int().positive(),
		...ledgerPaymentFieldsShape,
	})
	.superRefine(paymentReferenceRefine);

export const payExpenseSchema = z
	.object({
		id: z.number().int().positive(),
		...ledgerPaymentFieldsShape,
	})
	.superRefine(paymentReferenceRefine);

export const getLedgerDetailsSchema = z.object({
	bookingId: z.number().int().positive(),
});

export const getLedgerTransactionsSchema = z.object({
	bookingId: z.number().int().positive(),
});

export const deleteLedgerTransactionSchema = z.object({
	id: z.number().int().positive(),
});
