import { useSelector } from "@tanstack/react-store";
import { FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { reservationFeeTypeOptions } from "./create-booking-form.constants";
import type { CreateBookingFormSectionProps } from "./create-booking-form.types";

export function CreateBookingReservationSection({
	form,
	rooms = [],
}: CreateBookingFormSectionProps) {
	const bookingType = useSelector(form.store, (s) => s.values.bookingType);
	const selectedRoomId = useSelector(form.store, (s) => s.values.roomId);
	const monthlyDuration = useSelector(
		form.store,
		(s) => s.values.monthlyDuration ?? 1,
	);
	const isMonthly = bookingType === "MONTHLY";

	const feeTypeField = isMonthly ? "cashAdvanceType" : "reservationFeeType";
	const feeValueField = isMonthly ? "cashAdvanceValue" : "reservationFeeValue";

	if (isMonthly) {
		const selectedRoom = rooms.find(
			(r) => String(r.id) === String(selectedRoomId),
		);
		const monthlyPrice = selectedRoom?.monthlyPrice
			? Number(selectedRoom.monthlyPrice)
			: 0;
		const duration = monthlyDuration || 1;
		const isExtended = duration > 1;

		return (
			<div className="grid gap-4 rounded-lg border p-4">
				<div className="space-y-2">
					<FieldLabel className="text-base">Payment option</FieldLabel>
					<p className="text-xs text-muted-foreground">
						Choose when the guest pays and how long the booking covers.
					</p>
					<RadioGroup
						value={isExtended ? "extended" : "asis"}
						onValueChange={(value) => {
							if (value === "extended") {
								form.setFieldValue("monthlyDuration", 2);
								form.setFieldValue("cashAdvanceType", "FIXED");
								form.setFieldValue("cashAdvanceValue", monthlyPrice * 2);
							} else {
								form.setFieldValue("monthlyDuration", 1);
								form.setFieldValue("cashAdvanceType", undefined);
								form.setFieldValue("cashAdvanceValue", undefined);
							}
						}}
					>
						<div className="flex flex-col gap-2">
							{/* biome-ignore lint/a11y/noLabelWithoutControl: RadioGroupItem is a custom form control */}
							<label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
								<RadioGroupItem value="asis" className="mt-0.5" />
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-sm">As is</span>
									<span className="text-xs text-muted-foreground">
										1 month — full amount due at check-in
									</span>
								</div>
							</label>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: RadioGroupItem is a custom form control */}
							<label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
								<RadioGroupItem value="extended" className="mt-0.5" />
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-sm">
										With advance deposit (2 months)
									</span>
									<span className="text-xs text-muted-foreground">
										{monthlyPrice > 0
											? `₱${(monthlyPrice * 2).toLocaleString()} due now, checkout moves to 2 months`
											: "2 months due now"}
									</span>
								</div>
							</label>
						</div>
					</RadioGroup>
				</div>
			</div>
		);
	}

	return (
		<div className="grid gap-4 rounded-lg border p-4">
			<p className="text-xs text-muted-foreground">
				Set the reservation fee the guest must pay to hold this booking.
			</p>
			<form.AppField name={feeTypeField}>
				{(field) => (
					<field.RadioChoiceCardField
						label="Reservation fee type"
						options={[...reservationFeeTypeOptions]}
					/>
				)}
			</form.AppField>
			<form.Subscribe selector={(state) => state.values.reservationFeeType}>
				{(feeType) => (
					<form.AppField name={feeValueField}>
						{(field) => (
							<field.NumberField
								label={
									feeType === "PERCENT"
										? "Reservation fee percentage"
										: "Reservation fee amount (₱)"
								}
							/>
						)}
					</form.AppField>
				)}
			</form.Subscribe>
		</div>
	);
}
