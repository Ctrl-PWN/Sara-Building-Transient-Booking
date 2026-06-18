import { useSelector } from "@tanstack/react-store";
import { FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { reservationFeeTypeOptions } from "./create-booking-form.constants";
import type { CreateBookingFormSectionProps } from "./create-booking-form.types";

export function CreateBookingReservationSection({
	form,
	rooms = [],
}: CreateBookingFormSectionProps) {
	const bookingType = useSelector(form.store, (s) => s.values.bookingType);
	const selectedRoomId = useSelector(form.store, (s) => s.values.roomId);
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

		return (
			<div className="grid gap-4 rounded-lg border p-4">
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<FieldLabel className="text-base">Collect cash advance</FieldLabel>
						<p className="text-xs text-muted-foreground">
							Guest pays{" "}
							{monthlyPrice > 0
								? `₱${monthlyPrice.toLocaleString()}`
								: "monthly rate"}{" "}
							now to reserve this slot.
						</p>
					</div>
					<SwitchWithForm
						form={form}
						fieldName="cashAdvanceType"
						onCheckedChange={(checked) => {
							if (checked) {
								form.setFieldValue("cashAdvanceType", "FIXED");
								form.setFieldValue("cashAdvanceValue", monthlyPrice);
							} else {
								form.setFieldValue("cashAdvanceType", undefined);
								form.setFieldValue("cashAdvanceValue", undefined);
							}
						}}
					/>
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

function SwitchWithForm({
	form,
	fieldName,
	onCheckedChange,
}: {
	form: CreateBookingFormSectionProps["form"];
	fieldName: string;
	onCheckedChange: (checked: boolean) => void;
}) {
	const value = useSelector(
		form.store,
		(s) => (s.values as Record<string, unknown>)[fieldName],
	);
	return <Switch checked={!!value} onCheckedChange={onCheckedChange} />;
}
