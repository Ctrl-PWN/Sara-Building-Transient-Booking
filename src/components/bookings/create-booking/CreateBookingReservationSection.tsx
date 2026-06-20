import { useSelector } from "@tanstack/react-store";
import { FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPeso } from "@/lib/bookings/stay-pricing";
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
	const reservationFeeType = useSelector(
		form.store,
		(s) => s.values.reservationFeeType,
	);
	const reservationFeeValue = useSelector(
		form.store,
		(s) => s.values.reservationFeeValue,
	);
	const isMonthly = bookingType === "MONTHLY";

	if (isMonthly) {
		const selectedRoom = rooms.find(
			(r) => String(r.id) === String(selectedRoomId),
		);
		const monthlyPrice = selectedRoom?.monthlyPrice
			? Number(selectedRoom.monthlyPrice)
			: 0;
		const isExtended = monthlyDuration > 1;
		const hasFee = reservationFeeType != null && (reservationFeeValue ?? 0) > 0;

		return (
			<div className="grid gap-4 rounded-lg border p-4">
				<div className="space-y-2">
					<FieldLabel className="text-base">Stay length</FieldLabel>
					<p className="text-xs text-muted-foreground">
						Choose how long the reservation covers.
					</p>
					<RadioGroup
						value={isExtended ? "extended" : "asis"}
						onValueChange={(value) => {
							if (value === "extended") {
								form.setFieldValue("monthlyDuration", 2);
								form.setFieldValue("hasAdvance", true);
							} else {
								form.setFieldValue("monthlyDuration", 1);
								form.setFieldValue("hasAdvance", false);
							}
						}}
					>
						<div className="flex flex-col gap-2">
							{/* biome-ignore lint/a11y/noLabelWithoutControl: RadioGroupItem is a custom form control */}
							<label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
								<RadioGroupItem value="asis" className="mt-0.5" />
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-sm">1 month</span>
									<span className="text-xs text-muted-foreground">
										1 month stay — pay reservation fee now, balance at check-in
									</span>
								</div>
							</label>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: RadioGroupItem is a custom form control */}
							<label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
								<RadioGroupItem value="extended" className="mt-0.5" />
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-sm">2 months</span>
									<span className="text-xs text-muted-foreground">
										2 month stay — pay reservation fee now, balance + 2nd month
										advance at check-in
									</span>
								</div>
							</label>
						</div>
					</RadioGroup>
				</div>

				<div className="space-y-3 border-t pt-3">
					<FieldLabel className="text-base">Reservation fee</FieldLabel>
					<p className="text-xs text-muted-foreground">
						Amount the guest pays now to hold the booking. Applied to the first
						month's rent.
					</p>
					<form.AppField name="reservationFeeType">
						{(field) => (
							<field.RadioChoiceCardField
								label="Fee type"
								options={[...reservationFeeTypeOptions]}
							/>
						)}
					</form.AppField>
					<form.Subscribe selector={(state) => state.values.reservationFeeType}>
						{(feeType) => (
							<form.AppField name="reservationFeeValue">
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
					{hasFee && monthlyPrice > 0 && (
						<p className="text-xs text-muted-foreground">
							{reservationFeeType === "PERCENT"
								? `${reservationFeeValue}% of ${formatPeso(monthlyPrice)} = ${formatPeso((monthlyPrice * (reservationFeeValue ?? 0)) / 100)}`
								: `Fixed ${formatPeso(reservationFeeValue ?? 0)}`}
						</p>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="grid gap-4 rounded-lg border p-4">
			<p className="text-xs text-muted-foreground">
				Set the reservation fee the guest must pay to hold this booking.
			</p>
			<form.AppField name="reservationFeeType">
				{(field) => (
					<field.RadioChoiceCardField
						label="Reservation fee type"
						options={[...reservationFeeTypeOptions]}
					/>
				)}
			</form.AppField>
			<form.Subscribe selector={(state) => state.values.reservationFeeType}>
				{(feeType) => (
					<form.AppField name="reservationFeeValue">
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
