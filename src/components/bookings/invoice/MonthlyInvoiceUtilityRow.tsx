import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MonthlyInvoiceForm } from "./useMonthlyInvoiceForm";

const UTILITY_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: "ELECTRICITY", label: "Electricity" },
	{ value: "WATER", label: "Water" },
	{ value: "INTERNET", label: "Internet" },
	{ value: "OTHER", label: "Other" },
];

type MonthlyInvoiceUtilityRowProps = {
	form: MonthlyInvoiceForm;
	index: number;
	onRemove: () => void;
};

export function MonthlyInvoiceUtilityRow({
	form,
	index,
	onRemove,
}: MonthlyInvoiceUtilityRowProps) {
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
		</div>
	);
}

export function MonthlyInvoiceUtilitySection({
	form,
}: {
	form: MonthlyInvoiceForm;
}) {
	return (
		<div className="rounded-lg border p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-medium">Utility charges</p>
					<p className="text-xs text-muted-foreground">
						Enter amounts for this billing period
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						form.pushFieldValue("utilities", {
							utilityType: "ELECTRICITY",
							amount: 0,
							description: "Electricity bill",
						})
					}
				>
					<PlusIcon data-icon="inline-start" />
					Add utility
				</Button>
			</div>

			<form.Field name="utilities" mode="array">
				{(field) => {
					if (field.state.value.length === 0) {
						return (
							<p className="text-xs text-muted-foreground">
								No utility charges added. The invoice will only include the room
								rate.
							</p>
						);
					}
					return (
						<div className="space-y-3">
							{field.state.value.map((_, index) => (
								<MonthlyInvoiceUtilityRow
									// biome-ignore lint/suspicious/noArrayIndexKey: tanstack-form array field
									key={index}
									form={form}
									index={index}
									onRemove={() => field.removeValue(index)}
								/>
							))}
						</div>
					);
				}}
			</form.Field>
		</div>
	);
}
