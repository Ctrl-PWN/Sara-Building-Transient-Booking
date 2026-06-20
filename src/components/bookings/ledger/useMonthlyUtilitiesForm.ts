import type { PaymentMethod } from "@/db/schema/enums";
import {
	dynamicSchemaValidators,
	useAppForm,
} from "@/integrations/tanstack-form";
import {
	type MonthlyUtilitiesFormValues,
	monthlyUtilitiesFormSchema,
} from "@/lib/ledger/schemas";

export type UtilityItemValue = {
	utilityType: "ELECTRICITY" | "WATER" | "INTERNET" | "OTHER";
	amount: number;
	description: string;
};

type UseMonthlyUtilitiesFormOpts = {
	defaultPeriodIndex?: number;
	defaultItems?: UtilityItemValue[];
	onSubmit: (values: MonthlyUtilitiesFormValues) => Promise<void>;
};

export function useMonthlyUtilitiesForm({
	defaultPeriodIndex = 0,
	defaultItems = [],
	onSubmit,
}: UseMonthlyUtilitiesFormOpts) {
	return useAppForm({
		defaultValues: {
			periodIndex: defaultPeriodIndex,
			items: defaultItems,
			paymentMethod: "CASH" as PaymentMethod,
			referenceNumber: "",
		},
		...dynamicSchemaValidators(monthlyUtilitiesFormSchema),
		onSubmit: async ({ value }) => {
			await onSubmit({
				periodIndex: value.periodIndex,
				items: value.items,
				paymentMethod: value.paymentMethod,
				referenceNumber: value.referenceNumber,
			});
		},
	});
}

export type MonthlyUtilitiesForm = ReturnType<typeof useMonthlyUtilitiesForm>;
