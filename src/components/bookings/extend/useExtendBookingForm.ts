import { z } from "zod";
import type { PaymentMethod } from "@/db/schema/enums";
import {
	dynamicSchemaValidators,
	formOptions,
	useAppForm,
} from "@/integrations/tanstack-form";
import {
	type UtilityExpenseItem,
	utilityExpenseItemsSchema,
} from "@/lib/ledger/schemas";

export const fullExtendSchema = z.object({
	withCashAdvance: z.boolean(),
	paymentMethod: z.enum(["CASH", "GCASH", "BANK_TRANSFER"]),
	referenceNumber: z.string(),
	utilities: utilityExpenseItemsSchema,
});

const extendFormOptions = formOptions({
	defaultValues: {
		withCashAdvance: true,
		paymentMethod: "CASH" as PaymentMethod,
		referenceNumber: "",
		utilities: [] as Array<z.infer<typeof utilityExpenseItemsSchema>[number]>,
	},
});

export type ExtendBookingFormValues = {
	withCashAdvance: boolean;
	paymentMethod: "CASH" | "GCASH" | "BANK_TRANSFER";
	referenceNumber: string;
	utilities: UtilityExpenseItem[];
};

type UseExtendBookingFormOpts = {
	onSubmit: (values: ExtendBookingFormValues) => void;
};

export function useExtendBookingForm({ onSubmit }: UseExtendBookingFormOpts) {
	return useAppForm({
		...extendFormOptions,
		...dynamicSchemaValidators(fullExtendSchema),
		onSubmit: async ({ value }) => {
			onSubmit({
				withCashAdvance: value.withCashAdvance,
				paymentMethod: value.paymentMethod,
				referenceNumber: value.referenceNumber,
				utilities: value.utilities,
			});
		},
	});
}

export type ExtendBookingForm = ReturnType<typeof useExtendBookingForm>;
