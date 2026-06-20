import { z } from "zod";

import { utilityTypeSchema } from "@/lib/ledger/schemas";

export const monthlyInvoiceUtilityLineSchema = z.object({
	utilityType: utilityTypeSchema,
	description: z.string().min(1, "Description is required"),
	amount: z.number().positive("Amount must be greater than zero"),
});

export type MonthlyInvoiceUtilityLine = z.infer<
	typeof monthlyInvoiceUtilityLineSchema
>;

export const monthlyInvoiceFormSchema = z.object({
	periodIndex: z.number().int().min(0),
	utilities: z.array(monthlyInvoiceUtilityLineSchema),
});

export type MonthlyInvoiceFormValues = z.infer<typeof monthlyInvoiceFormSchema>;

export const monthlyInvoiceSearchSchema = z.object({
	period: z.number().int().min(0).optional().default(0),
});
