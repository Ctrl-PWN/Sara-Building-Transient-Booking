import { useSelector } from "@tanstack/react-store";
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
	const walkIn = useSelector(form.store, (s) => s.values.walkIn);
	const checkInDate = useSelector(form.store, (s) => s.values.checkInDate);
	const checkOutDate = useSelector(form.store, (s) => s.values.checkOutDate);
	const checkInTime = useSelector(form.store, (s) => s.values.checkInTime);
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

			{step === 2 && !isMonthly && !walkIn && (
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

			{step === 2 && !isMonthly && walkIn && (
				<>
					<div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Check-in date</span>
							<span className="font-medium">
								{checkInDate ? formatDateDisplay(checkInDate) : "—"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Check-in time</span>
							<span className="font-medium">
								{checkInTime ? formatTime12h(checkInTime) : "—"}
							</span>
						</div>
					</div>

					<form.AppField name="checkOutDate">
						{(field) => (
							<field.DateField
								label="Check-out Date"
								minDate={new Date()}
								disabledDates={isDateDisabled}
							/>
						)}
					</form.AppField>

					<form.AppField name="checkOutTime">
						{(field) => <field.TimeField label="Check-out Time" />}
					</form.AppField>

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

			{step === 2 && isMonthly && !walkIn && (
			<>
				<form.AppField name="checkInDate">
					{(field) => (
						<field.DateField
							label="Check-in Date"
							minDate={new Date()}
							disabledDates={isDateDisabled}
							onValueChange={(dateStr) => {
								if (dateStr) {
									const dur = form.getFieldValue("monthlyDuration") || 1;
									form.setFieldValue("checkOutDate", computeMonthlyCheckOut(dateStr, dur));
								}
							}}
						/>
					)}
				</form.AppField>

				<form.AppField name="checkInTime">
					{(field) => <field.TimeField label="Check-in Time" />}
				</form.AppField>

			{checkInDate && (() => {
				const dur = form.getFieldValue("monthlyDuration") || 1;
				return (
					<p className="text-xs text-muted-foreground">
						Check-out:{" "}
						<span className="font-medium text-foreground">
							{formatDateDisplay(computeMonthlyCheckOut(checkInDate, dur))}
						</span>{" "}
						({dur} month{dur === 1 ? "" : "s"})
					</p>
				);
			})()}
			</>
		)}

			{step === 2 && isMonthly && walkIn && (
			<>
				<div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Check-in date</span>
						<span className="font-medium">
							{checkInDate ? formatDateDisplay(checkInDate) : "—"}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Check-in time</span>
						<span className="font-medium">
							{checkInTime ? formatTime12h(checkInTime) : "—"}
						</span>
					</div>
				</div>

				<form.AppField name="checkOutDate">
					{(field) => (
						<field.DateField
							label="Check-out Date"
							minDate={new Date()}
							disabledDates={isDateDisabled}
						/>
					)}
				</form.AppField>

				<form.AppField name="checkOutTime">
					{(field) => <field.TimeField label="Check-out Time" />}
				</form.AppField>

				{checkOutDate && checkInDate && (() => {
					const diffMs = new Date(checkOutDate).getTime() - new Date(checkInDate).getTime();
					const months = Math.max(1, Math.round(diffMs / (30 * 24 * 60 * 60 * 1000)));
					return (
						<p className="text-xs text-muted-foreground">
							Duration:{" "}
							<span className="font-medium text-foreground">
								{months} month{months === 1 ? "" : "s"}
							</span>
						</p>
					);
				})()}
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
