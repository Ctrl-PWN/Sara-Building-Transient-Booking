import { paymentMethodOptions } from "./create-booking-form.constants";
import type { CreateBookingFormSectionProps } from "./create-booking-form.types";

export function CreateBookingPaymentSection({
	form,
}: CreateBookingFormSectionProps) {
	return (
		<div className="grid gap-4 rounded-lg border p-4">
			<form.AppField name="paymentMethod">
				{(field) => (
					<field.RadioChoiceCardField
						label="Payment method"
						options={[...paymentMethodOptions]}
						onValueChange={(method) => {
							if (method === "CASH") {
								form.setFieldValue("referenceNumber", "");
							}
						}}
					/>
				)}
			</form.AppField>
			<form.Subscribe selector={(state) => state.values.paymentMethod}>
				{(paymentMethod) => (
					<form.AppField name="referenceNumber">
						{(field) => (
							<field.TextField
								label="Reference number"
								placeholder="Required for GCash and bank transfer"
								disabled={paymentMethod === "CASH"}
							/>
						)}
					</form.AppField>
				)}
			</form.Subscribe>
		</div>
	);
}
