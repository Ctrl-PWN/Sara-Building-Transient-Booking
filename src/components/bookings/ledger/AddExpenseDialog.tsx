import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogFooter,
	DialogHeader,
	DialogOutsideScroll,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	dynamicSchemaValidators,
	useAppForm,
} from "@/integrations/tanstack-form";
import { ledgerMutations } from "@/lib/ledger/ledger.mutations";
import { addExpenseFormSchema } from "@/lib/ledger/schemas";

import { LedgerPaymentFieldsSection } from "./LedgerPaymentFieldsSection";

type AddExpenseDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bookingId: number;
};

const UTILITY_TYPE_OPTIONS = [
	{ value: "ELECTRICITY", label: "Electricity" },
	{ value: "WATER", label: "Water" },
	{ value: "INTERNET", label: "Internet" },
	{ value: "OTHER", label: "Other" },
];

export function AddExpenseDialog({
	open,
	onOpenChange,
	bookingId,
}: AddExpenseDialogProps) {
	const queryClient = useQueryClient();
	const mutation = useMutation(ledgerMutations.createExpense(queryClient));

	const defaultValues: z.input<typeof addExpenseFormSchema> = {
		amount: 0,
		description: "",
		isPaid: false,
		category: "ROOM_CHARGE",
		utilityType: undefined,
		paymentMethod: undefined,
		referenceNumber: "",
	};

	const form = useAppForm({
		defaultValues,
		...dynamicSchemaValidators(addExpenseFormSchema),
		onSubmit: async ({ value }) => {
			await mutation.mutateAsync({
				bookingId,
				amount: value.amount,
				description: value.description.trim(),
				isPaid: value.isPaid,
				category: value.category,
				utilityType:
					value.category === "UTILITY" ? value.utilityType : undefined,
				paymentMethod: value.isPaid ? value.paymentMethod : undefined,
				referenceNumber: value.isPaid ? value.referenceNumber : undefined,
			});
			form.reset();
			onOpenChange(false);
		},
	});

	const category = useSelector(form.store, (state) => state.values.category);
	const isPaid = useSelector(form.store, (state) => state.values.isPaid);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogOutsideScroll className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add charge</DialogTitle>
				</DialogHeader>
				<form
					className="space-y-4 py-2"
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<form.AppForm>
						<form.AppField name="category">
							{(field) => (
								<field.SelectField
									label="Category"
									options={[
										{ value: "ROOM_CHARGE", label: "Room charge" },
										{ value: "UTILITY", label: "Utility" },
									]}
								/>
							)}
						</form.AppField>

						{category === "UTILITY" && (
							<form.AppField name="utilityType">
								{(field) => (
									<field.SelectField
										label="Utility type"
										options={UTILITY_TYPE_OPTIONS}
									/>
								)}
							</form.AppField>
						)}

						<form.AppField name="description">
							{(field) => (
								<field.TextField
									label="Description"
									placeholder="e.g. Extra towels, minibar"
								/>
							)}
						</form.AppField>
						<form.AppField name="amount">
							{(field) => (
								<field.NumberField label="Amount" placeholder="0.00" min={0} />
							)}
						</form.AppField>
						<form.AppField name="isPaid">
							{(field) => <field.ToggleField label="Mark as paid" />}
						</form.AppField>
						{isPaid && (
							<LedgerPaymentFieldsSection form={form} disabled={!isPaid} />
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<form.SubmitButton label="Add charge" />
						</DialogFooter>
					</form.AppForm>
				</form>
			</DialogOutsideScroll>
		</Dialog>
	);
}
