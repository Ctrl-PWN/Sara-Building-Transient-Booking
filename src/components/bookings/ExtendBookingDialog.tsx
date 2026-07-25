import { useQuery } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogFooter,
	DialogHeader,
	DialogOutsideScroll,
	DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { bookingQueries } from "@/lib/bookings/bookings.queries";
import { addMonthlyPeriodEnd } from "@/lib/bookings/monthly-billing-periods";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatManilaDate } from "@/lib/date/manila";
import { ledgerQueries } from "@/lib/ledger/ledger.queries";

import {
	type ExtendBookingFormValues,
	useExtendBookingForm,
} from "./extend/useExtendBookingForm";

type ExtendBookingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	booking: BookingWithRoom;
	onConfirm: (values: ExtendBookingFormValues) => void;
};

function computeNewCheckOut(currentCheckOut: string): Date {
	return addMonthlyPeriodEnd(new Date(currentCheckOut));
}

function toIsoDateString(date: Date): string {
	return formatManilaDate(date);
}

export function ExtendBookingDialog({
	open,
	onOpenChange,
	booking,
	onConfirm,
}: ExtendBookingDialogProps) {
	const monthlyPrice = Number(booking.roomMonthlyPrice) || 0;
	const defaultNewCheckOut = computeNewCheckOut(booking.checkOut);
	const currentCheckOutDate = new Date(booking.checkOut);

	const { data: allBookings = [] } = useQuery(bookingQueries.list());
	const { data: transactions = [] } = useQuery(
		ledgerQueries.transactions(booking.id),
	);
	const existingMonthlyRentDue = transactions
		.filter(
			(transaction) =>
				!transaction.isPaid &&
				(transaction.category === "ROOM_CHARGE" ||
					transaction.category === "ADVANCE"),
		)
		.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
	const totalDueNow = existingMonthlyRentDue + monthlyPrice;

	const [useCustomDate, setUseCustomDate] = useState(false);

	const form = useExtendBookingForm({ onSubmit: onConfirm });

	const newCheckOutDate = useSelector(
		form.store,
		(state) => state.values.newCheckOutDate,
	);

	useEffect(() => {
		if (open) {
			form.setFieldValue(
				"newCheckOutDate",
				toIsoDateString(defaultNewCheckOut),
			);
			setUseCustomDate(false);
		}
	}, [open, defaultNewCheckOut, form]);

	useEffect(() => {
		if (!useCustomDate) {
			form.setFieldValue(
				"newCheckOutDate",
				toIsoDateString(defaultNewCheckOut),
			);
		}
	}, [useCustomDate, defaultNewCheckOut, form]);

	const effectiveNewCheckOut = newCheckOutDate
		? new Date(newCheckOutDate)
		: defaultNewCheckOut;

	const periodLabel = `${format(currentCheckOutDate, "MMM d")} – ${format(
		effectiveNewCheckOut,
		"MMM d, yyyy",
	)}`;

	const currentCheckOutKey = (() => {
		const d = new Date(booking.checkOut);
		d.setHours(0, 0, 0, 0);
		return d.getTime();
	})();

	const bookedDays = new Set<number>();
	for (const b of allBookings) {
		if (b.id === booking.id) continue;
		if (b.roomId !== booking.roomId) continue;
		if (b.status !== "RESERVED" && b.status !== "CHECKED_IN") continue;
		const bStart = new Date(b.checkIn);
		bStart.setHours(0, 0, 0, 0);
		const bEnd = new Date(b.checkOut);
		bEnd.setHours(0, 0, 0, 0);
		if (bStart.getTime() === bEnd.getTime()) {
			bookedDays.add(bStart.getTime());
		} else {
			for (let t = bStart.getTime(); t < bEnd.getTime(); t += 86_400_000) {
				bookedDays.add(t);
			}
		}
	}

	const isDateDisabled = (date: Date) => {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		const key = d.getTime();
		if (key <= currentCheckOutKey) return true;
		return bookedDays.has(key);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogOutsideScroll className="sm:max-w-lg">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.AppForm>
						<DialogHeader>
							<DialogTitle>Extend Booking</DialogTitle>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Current checkout
									</span>
									<span className="font-medium">
										{format(currentCheckOutDate, "MMM d, yyyy")}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">New checkout</span>
									<span className="font-medium">
										{format(effectiveNewCheckOut, "MMM d, yyyy")}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Room</span>
									<span className="font-medium">
										{booking.roomNumber} ({booking.roomType})
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Monthly rate</span>
									<span className="font-medium">
										{formatPeso(monthlyPrice)}
									</span>
								</div>
							</div>

							<div className="flex items-center justify-between rounded-lg border p-3">
								<div className="flex flex-col gap-0.5">
									<span className="font-medium text-sm">
										Change checkout date
									</span>
									<span className="text-xs text-muted-foreground">
										Pick a date within the next month (booked dates are
										disabled)
									</span>
								</div>
								<Switch
									checked={useCustomDate}
									onCheckedChange={setUseCustomDate}
								/>
							</div>

							{useCustomDate && (
								<form.AppField name="newCheckOutDate">
									{(field) => (
										<field.DateField
											label="New checkout date"
											description="Select a date up to 1 month from the current checkout"
											minDate={new Date(booking.checkOut)}
											maxDate={defaultNewCheckOut}
											disabledDates={isDateDisabled}
										/>
									)}
								</form.AppField>
							)}

							<div className="rounded-lg border p-3 shadow-sm">
								<p className="text-sm font-medium">Advance payment required</p>
								<p className="text-xs text-muted-foreground">
									The full monthly rate must be paid now to reserve the extended
									period.
								</p>
							</div>

							<form.AppField name="paymentMethod">
								{(field) => (
									<field.SelectField
										label="Payment method"
										options={[
											{ value: "CASH", label: "Cash" },
											{ value: "GCASH", label: "GCash" },
											{ value: "BANK_TRANSFER", label: "Bank Transfer" },
										]}
									/>
								)}
							</form.AppField>

							<form.AppField name="referenceNumber">
								{(field) => (
									<field.TextField
										label="Reference number"
										placeholder="Enter reference number"
									/>
								)}
							</form.AppField>

							<div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
								{existingMonthlyRentDue > 0 ? (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Existing monthly rent due
										</span>
										<span className="font-medium">
											{formatPeso(existingMonthlyRentDue)}
										</span>
									</div>
								) : null}
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Next month advance
									</span>
									<span className="font-medium">
										{formatPeso(monthlyPrice)}
									</span>
								</div>
								<div className="flex justify-between border-t pt-2 font-semibold">
									<span>Total due now</span>
									<span>{formatPeso(totalDueNow)}</span>
								</div>
								<p className="text-xs text-muted-foreground">
									Payment reserves the extension for {periodLabel}.
								</p>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								type="button"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<form.SubmitButton label="Extend & record payment" />
						</DialogFooter>
					</form.AppForm>
				</form>
			</DialogOutsideScroll>
		</Dialog>
	);
}
