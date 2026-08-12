import { z } from "zod";
import type { PaymentMethod } from "@/db/schema/enums";
import {
	dynamicSchemaValidators,
	formOptions,
	useAppForm,
} from "@/integrations/tanstack-form";
import { paymentReferenceRefine } from "@/lib/ledger/schemas";

export const fullExtendSchema = z
	.object({
		newCheckOutDate: z.string().min(1, "Checkout date is required"),
		paymentMethod: z.enum(["CASH", "GCASH", "BANK_TRANSFER"]),
		referenceNumber: z.string(),
	})
	.superRefine(paymentReferenceRefine);

const extendFormOptions = formOptions({
	defaultValues: {
		newCheckOutDate: "",
		paymentMethod: "CASH" as PaymentMethod,
		referenceNumber: "",
	},
});

export type ExtendBookingFormValues = {
	newCheckOutDate: string;
	paymentMethod: "CASH" | "GCASH" | "BANK_TRANSFER";
	referenceNumber: string;
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
				newCheckOutDate: value.newCheckOutDate,
				paymentMethod: value.paymentMethod,
				referenceNumber: value.referenceNumber,
			});
		},
	});
}

export type ExtendBookingForm = ReturnType<typeof useExtendBookingForm>;
