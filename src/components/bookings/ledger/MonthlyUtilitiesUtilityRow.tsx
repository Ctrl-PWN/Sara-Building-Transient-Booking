import { TrashIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UTILITY_TYPE_LABELS } from "./monthly-utilities.helpers";
import type { MonthlyUtilitiesForm } from "./useMonthlyUtilitiesForm";

type MonthlyUtilitiesUtilityRowProps = {
	form: MonthlyUtilitiesForm;
	index: number;
	utilityType: string;
	canRemove: boolean;
	onRemove: () => void;
};

export function MonthlyUtilitiesUtilityRow({
	form,
	index,
	utilityType,
	canRemove,
	onRemove,
}: MonthlyUtilitiesUtilityRowProps) {
	return (
		<div className="rounded-md border bg-card p-3 space-y-2">
			<div className="flex items-center justify-between">
				<Badge variant="secondary">
					{UTILITY_TYPE_LABELS[utilityType] ?? utilityType}
				</Badge>
				{canRemove ? (
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onRemove}
						aria-label="Remove utility"
					>
						<TrashIcon />
					</Button>
				) : null}
			</div>

			<form.AppField name={`items[${index}].amount`}>
				{(field) => (
					<field.NumberField label="Amount" placeholder="0.00" min={0} />
				)}
			</form.AppField>

			<form.AppField name={`items[${index}].description`}>
				{(field) => (
					<field.TextField
						label="Description"
						placeholder="e.g. Electricity bill"
					/>
				)}
			</form.AppField>
		</div>
	);
}
