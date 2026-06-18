import { useSelector } from "@tanstack/react-store";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { bookingTypeOptions } from "./create-booking-form.constants";
import type { CreateBookingForm } from "./create-booking-form.types";
import {
	getEarliestCheckInTime,
	getLatestCheckOutTime,
} from "./useCreateBookingAvailability";

function formatTime12h(hhmm: string): string {
	const [h, m] = hhmm.split(":").map(Number);
	if (h === 0) return `12:${String(m).padStart(2, "0")} AM`;
	if (h < 12) return `${h}:${String(m).padStart(2, "0")} AM`;
	if (h === 12) return `12:${String(m).padStart(2, "0")} PM`;
	return `${h - 12}:${String(m).padStart(2, "0")} PM`;
}

function computeMonthlyCheckOut(
	checkInDate: string,
	durationMonths: number,
): string {
	const date = new Date(checkInDate);
	const targetMonth = date.getMonth() + durationMonths;
	const targetYear = date.getFullYear();
	const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
	const day = Math.min(date.getDate(), lastDayOfMonth);
	const checkOut = new Date(targetYear, targetMonth, day);
	const y = checkOut.getFullYear();
	const m = String(checkOut.getMonth() + 1).padStart(2, "0");
	const d = String(checkOut.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

type CreateBookingStayFieldsProps = {
	form: CreateBookingForm;
	step: number;
	roomOptions: {
		value: string;
		label: string;
		disabled: boolean;
	}[];
	isDateDisabled: (date: Date) => boolean;
	bookings: BookingWithRoom[];
};

export function CreateBookingStayFields({
	form,
	step,
	roomOptions,
	isDateDisabled,
	bookings,
}: CreateBookingStayFieldsProps) {
	const selectedRoomId = useSelector(form.store, (s) => s.values.roomId);
	const bookingType = useSelector(form.store, (s) => s.values.bookingType);
	const checkInDate = useSelector(form.store, (s) => s.values.checkInDate);
	const checkOutDate = useSelector(form.store, (s) => s.values.checkOutDate);
	const roomIdNum = selectedRoomId ? Number(selectedRoomId) : 0;

	const earliestCheckIn =
		roomIdNum && checkInDate
			? getEarliestCheckInTime(bookings, roomIdNum, checkInDate)
			: null;
	const latestCheckOut =
		roomIdNum && checkOutDate
			? getLatestCheckOutTime(bookings, roomIdNum, checkOutDate)
			: null;

	const isMonthly = bookingType === "MONTHLY";

	return (
		<>
			{step === 1 && (
				<>
					<form.AppField name="bookingType">
						{(field) => (
							<field.RadioChoiceCardField
								label="Booking type"
								options={[...bookingTypeOptions]}
								onValueChange={(value) => {
									if (value === "MONTHLY") {
										form.setFieldValue("checkOutDate", "");
										form.setFieldValue("checkInTime", "14:00");
										form.setFieldValue("checkOutTime", "12:00");
										if (!form.getFieldValue("checkInDate")) {
											const today = new Date();
											const y = today.getFullYear();
											const m = String(today.getMonth() + 1).padStart(2, "0");
											const d = String(today.getDate()).padStart(2, "0");
											form.setFieldValue("checkInDate", `${y}-${m}-${d}`);
										}
									} else {
										form.setFieldValue("checkOutDate", "");
									}
								}}
							/>
						)}
					</form.AppField>
					<form.AppField name="roomId">
						{(field) => (
							<field.SelectField
								label="Room"
								placeholder="Select a room"
								options={roomOptions}
							/>
						)}
					</form.AppField>
				</>
			)}

			{step === 2 && !isMonthly && (
				<>
					<form.AppField name="checkInDate">
						{(field) => (
							<field.DateRangeField
								endFieldName="checkOutDate"
								label="Stay Dates"
								startLabel="Check-in"
								endLabel="Check-out"
								minDate={new Date()}
								disabledDates={isDateDisabled}
							/>
						)}
					</form.AppField>

					<div className="grid grid-cols-2 gap-4">
						<form.AppField name="checkInTime">
							{(field) => <field.TimeField label="Check-in Time" />}
						</form.AppField>
						<form.AppField name="checkOutTime">
							{(field) => <field.TimeField label="Check-out Time" />}
						</form.AppField>
					</div>

					{roomIdNum > 0 &&
						checkInDate &&
						earliestCheckIn &&
						earliestCheckIn !== "00:00" && (
							<p className="text-xs text-muted-foreground">
								Earliest check-in on this date:{" "}
								<span className="font-medium text-foreground">
									{formatTime12h(earliestCheckIn)}
								</span>{" "}
								(after previous guest checks out)
							</p>
						)}
					{roomIdNum > 0 &&
						checkOutDate &&
						latestCheckOut &&
						latestCheckOut !== "23:59" && (
							<p className="text-xs text-muted-foreground">
								Latest check-out on this date:{" "}
								<span className="font-medium text-foreground">
									{formatTime12h(latestCheckOut)}
								</span>{" "}
								(before next guest checks in)
							</p>
						)}
				</>
			)}

			{step === 2 && isMonthly && (
				<>
					<form.AppField name="checkInDate">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Check-in Date</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type="date"
									value={field.state.value as string}
									min={(() => {
										const today = new Date();
										const y = today.getFullYear();
										const m = String(today.getMonth() + 1).padStart(2, "0");
										const d = String(today.getDate()).padStart(2, "0");
										return `${y}-${m}-${d}`;
									})()}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										if (e.target.value) {
											const newCheckOut = computeMonthlyCheckOut(
												e.target.value,
												1,
											);
											form.setFieldValue("checkOutDate", newCheckOut);
										}
									}}
								/>
							</Field>
						)}
					</form.AppField>

					<form.AppField name="checkInTime">
						{(field) => <field.TimeField label="Check-in Time" />}
					</form.AppField>

					{checkInDate && (
						<p className="text-xs text-muted-foreground">
							Check-out:{" "}
							<span className="font-medium text-foreground">
								{formatDateDisplay(computeMonthlyCheckOut(checkInDate, 1))}
							</span>{" "}
							(1 month)
						</p>
					)}
				</>
			)}

			{step === 3 && (
				<>
					<div className="grid grid-cols-2 gap-4">
						<form.AppField name="firstName">
							{(field) => (
								<field.TextField label="First Name" placeholder="First name" />
							)}
						</form.AppField>
						<form.AppField name="lastName">
							{(field) => (
								<field.TextField label="Last Name" placeholder="Last name" />
							)}
						</form.AppField>
					</div>

					<form.AppField name="contactNumber">
						{(field) => (
							<field.TextField label="Contact" placeholder="Phone number" />
						)}
					</form.AppField>
					<form.AppField name="address">
						{(field) => (
							<field.TextField label="Address" placeholder="Guest address" />
						)}
					</form.AppField>

					<form.AppField name="occupantsCount">
						{(field) => <field.NumberField label="Occupants" />}
					</form.AppField>
				</>
			)}
		</>
	);
}
