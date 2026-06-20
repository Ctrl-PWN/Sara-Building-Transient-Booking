import type { z } from "zod";
import {
	dynamicSchemaValidators,
	useAppForm,
} from "@/integrations/tanstack-form";
import { monthlyInvoiceFormSchema } from "@/lib/invoices/schemas";

export type MonthlyInvoiceFormValues = z.infer<typeof monthlyInvoiceFormSchema>;

type MonthlyInvoiceDefaultValues = {
	periodIndex: number;
	utilities: Array<{
		utilityType: "ELECTRICITY" | "WATER" | "INTERNET" | "OTHER";
		amount: number;
		description: string;
	}>;
};

type UseMonthlyInvoiceFormOpts = {
	defaultPeriodIndex?: number;
	onSubmit: (values: MonthlyInvoiceFormValues) => void;
};

export function useMonthlyInvoiceForm({
	defaultPeriodIndex = 0,
	onSubmit,
}: UseMonthlyInvoiceFormOpts) {
	const defaultValues: MonthlyInvoiceDefaultValues = {
		periodIndex: defaultPeriodIndex,
		utilities: [],
	};

	return useAppForm({
		defaultValues,
		...dynamicSchemaValidators(monthlyInvoiceFormSchema),
		onSubmit: async ({ value }) => {
			onSubmit({
				periodIndex: value.periodIndex,
				utilities: value.utilities.filter((u) => u.amount > 0),
			});
		},
	});
}

export type MonthlyInvoiceForm = ReturnType<typeof useMonthlyInvoiceForm>;
