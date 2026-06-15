import type { BookingWithRoom } from "@/lib/bookings/types";
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
	const selectedRoomId = form.getFieldValue("roomId");
	const checkInDate = form.getFieldValue("checkInDate");
	const checkOutDate = form.getFieldValue("checkOutDate");
	const roomIdNum = selectedRoomId ? Number(selectedRoomId) : 0;

	const earliestCheckIn =
		roomIdNum && checkInDate
			? getEarliestCheckInTime(bookings, roomIdNum, checkInDate)
			: null;
	const latestCheckOut =
		roomIdNum && checkOutDate
			? getLatestCheckOutTime(bookings, roomIdNum, checkOutDate)
			: null;

	return (
		<>
			{step === 1 && (
				<form.AppField name="roomId">
					{(field) => (
						<field.SelectField
							label="Room"
							placeholder="Select a room"
							options={roomOptions}
						/>
					)}
				</form.AppField>
			)}

			{step === 2 && (
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
