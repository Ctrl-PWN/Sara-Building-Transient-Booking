import { z } from "zod";

import {
	ledgerTransactionCategoryEnum,
	paymentMethodEnum,
	utilityTypeEnum,
} from "@/db/schema/enums";

export const ledgerTransactionCategorySchema = z.enum(
	ledgerTransactionCategoryEnum.enumValues,
);
export const paymentMethodSchema = z.enum(paymentMethodEnum.enumValues);

export const utilityTypeSchema = z.enum(utilityTypeEnum.enumValues);

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
	"ADVANCE",
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
		category: z.enum(["ROOM_CHARGE", "UTILITY"]),
		utilityType: utilityTypeSchema.optional(),
		paymentMethod: paymentMethodSchema.optional(),
		referenceNumber: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.category === "UTILITY" && !data.utilityType) {
			ctx.addIssue({
				code: "custom",
				message: "Utility type is required for utility charges",
				path: ["utilityType"],
			});
		}
		chargeWithPaymentRefine(data, ctx);
	});

export const createExpenseSchema = z
	.object({
		bookingId: z.number().int().positive(),
		amount: z.number().positive("Amount must be greater than zero"),
		description: z.string().min(1, "Description is required"),
		isPaid: z.boolean().optional(),
		category: z.enum(["ROOM_CHARGE", "UTILITY"]).default("ROOM_CHARGE"),
		utilityType: utilityTypeSchema.optional(),
		paymentMethod: paymentMethodSchema.optional(),
		referenceNumber: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.category === "UTILITY" && !data.utilityType) {
			ctx.addIssue({
				code: "custom",
				message: "Utility type is required for utility charges",
				path: ["utilityType"],
			});
		}
		chargeWithPaymentRefine(data, ctx);
	});

export const utilityExpenseItemSchema = z.object({
	utilityType: utilityTypeSchema,
	amount: z.number().positive("Amount must be greater than zero"),
	description: z.string().min(1, "Description is required"),
});

export type UtilityExpenseItem = z.infer<typeof utilityExpenseItemSchema>;

export const utilityExpenseItemsSchema = z.array(utilityExpenseItemSchema);

export const generateUtilityPaymentItemSchema = z.object({
	utilityType: utilityTypeSchema,
	amount: z.number().min(0, "Amount cannot be negative"),
	description: z.string().min(1, "Description is required"),
});

export const generateUtilityPaymentItemsSchema = z.array(
	generateUtilityPaymentItemSchema,
);

export const generateUtilityPaymentsSchema = z
	.object({
		bookingId: z.number().int().positive(),
		periodIndex: z.number().int().min(0),
		items: generateUtilityPaymentItemsSchema,
		...ledgerPaymentFieldsShape,
	})
	.superRefine(paymentReferenceRefine);

export const monthlyUtilitiesSearchSchema = z.object({
	period: z.coerce.number().int().min(0).catch(0),
});

export const monthlyUtilitiesFormSchema = z
	.object({
		periodIndex: z.number().int().min(0),
		items: generateUtilityPaymentItemsSchema,
		...ledgerPaymentFieldsShape,
	})
	.superRefine((data, ctx) => {
		paymentReferenceRefine(data, ctx);
		const payable = data.items.filter((item) => item.amount > 0);
		if (payable.length === 0) {
			ctx.addIssue({
				code: "custom",
				message:
					"At least one utility with an amount greater than zero is required",
				path: ["items"],
			});
		}
	});

export type MonthlyUtilitiesFormValues = z.infer<
	typeof monthlyUtilitiesFormSchema
>;

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
