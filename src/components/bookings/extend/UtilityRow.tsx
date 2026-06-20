import { TrashIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExtendBookingForm } from "./useExtendBookingForm";

const UTILITY_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: "ELECTRICITY", label: "Electricity" },
	{ value: "WATER", label: "Water" },
	{ value: "INTERNET", label: "Internet" },
	{ value: "OTHER", label: "Other" },
];

const PAYMENT_METHOD_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: "CASH", label: "Cash" },
	{ value: "GCASH", label: "GCash" },
	{ value: "BANK_TRANSFER", label: "Bank Transfer" },
];

type UtilityRowProps = {
	form: ExtendBookingForm;
	index: number;
	onRemove: () => void;
};

export function UtilityRow({ form, index, onRemove }: UtilityRowProps) {
	return (
		<div className="rounded-md border bg-card p-3 space-y-2">
			<div className="flex items-center justify-between">
				<Badge variant="secondary">Utility #{index + 1}</Badge>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={onRemove}
					aria-label="Remove utility"
				>
					<TrashIcon />
				</Button>
			</div>

			<form.AppField name={`utilities[${index}].utilityType`}>
				{(field) => (
					<field.SelectField label="Type" options={UTILITY_TYPE_OPTIONS} />
				)}
			</form.AppField>

			<form.AppField name={`utilities[${index}].amount`}>
				{(field) => (
					<field.NumberField label="Amount" placeholder="0.00" min={0} />
				)}
			</form.AppField>

			<form.AppField name={`utilities[${index}].description`}>
				{(field) => <field.TextField label="Description" />}
			</form.AppField>

			<form.AppField name={`utilities[${index}].isPaid`}>
				{(field) => <field.ToggleField label="Mark as paid" />}
			</form.AppField>

			<form.Subscribe
				selector={(state) => Boolean(state.values.utilities?.[index]?.isPaid)}
			>
				{(isPaid) =>
					isPaid ? (
						<div className="space-y-2">
							<form.AppField name={`utilities[${index}].paymentMethod`}>
								{(field) => (
									<field.SelectField
										label="Payment method"
										options={PAYMENT_METHOD_OPTIONS}
									/>
								)}
							</form.AppField>
							<form.AppField name={`utilities[${index}].referenceNumber`}>
								{(field) => (
									<field.TextField
										label="Reference number"
										placeholder="Enter reference number"
									/>
								)}
							</form.AppField>
						</div>
					) : null
				}
			</form.Subscribe>
		</div>
	);
}
