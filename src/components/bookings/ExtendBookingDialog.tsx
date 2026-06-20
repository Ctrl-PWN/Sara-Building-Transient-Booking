import { PlusIcon } from "@phosphor-icons/react";
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
import { FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";

import { UtilityRow } from "./extend/UtilityRow";
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

function computeDefaultCheckOut(currentCheckOut: string): string {
	const current = new Date(currentCheckOut);
	const targetMonth = current.getMonth() + 1;
	const targetYear = current.getFullYear();
	const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
	const day = Math.min(current.getDate(), lastDayOfMonth);
	const d = new Date(targetYear, targetMonth, day, 12, 0, 0);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${dd}`;
}

function computeMonthsBetween(
	currentCheckOut: string,
	newCheckOut: string,
): number {
	const current = new Date(currentCheckOut);
	const target = new Date(newCheckOut);
	const diffMs = target.getTime() - current.getTime();
	const months = Math.round(diffMs / (30 * 24 * 60 * 60 * 1000));
	return Math.max(1, months);
}

export function ExtendBookingDialog({
	open,
	onOpenChange,
	booking,
	onConfirm,
}: ExtendBookingDialogProps) {
	const monthlyPrice = Number(booking.roomMonthlyPrice) || 0;
	const defaultCheckOut = computeDefaultCheckOut(booking.checkOut);
	const currentCheckOutDate = new Date(booking.checkOut);

	const [useCustomDate, setUseCustomDate] = useState(false);

	const form = useExtendBookingForm({ onSubmit: onConfirm });

	const newCheckOutDate = useSelector(
		form.store,
		(state) => state.values.newCheckOutDate,
	);

	useEffect(() => {
		form.setFieldValue("newCheckOutDate", defaultCheckOut);
	}, [defaultCheckOut, form]);

	useEffect(() => {
		if (!useCustomDate) {
			form.setFieldValue("newCheckOutDate", defaultCheckOut);
		}
	}, [useCustomDate, defaultCheckOut, form]);

	const periodLabel = newCheckOutDate
		? `${format(currentCheckOutDate, "MMM d")} – ${format(
				new Date(newCheckOutDate),
				"MMM d, yyyy",
			)}`
		: `${format(currentCheckOutDate, "MMM d")} – —`;

	const months = newCheckOutDate
		? computeMonthsBetween(booking.checkOut, newCheckOutDate)
		: 1;
	const monthlyTotal = monthlyPrice * months;

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
										{newCheckOutDate
											? format(new Date(newCheckOutDate), "MMM d, yyyy")
											: "—"}
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
										Pick a custom checkout date
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
											description="Select the new checkout date"
											minDate={new Date(booking.checkOut)}
										/>
									)}
								</form.AppField>
							)}

							<form.Subscribe
								selector={(state) => state.values.withCashAdvance}
							>
								{(withCashAdvance) => (
									<div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
										<div className="space-y-0.5">
											<FieldLabel className="text-base">
												Collect cash advance
											</FieldLabel>
											<p className="text-xs text-muted-foreground">
												Guest pays a portion now, rest due at check-in.
											</p>
										</div>
										<Switch
											checked={withCashAdvance}
											onCheckedChange={(checked) =>
												form.setFieldValue("withCashAdvance", checked)
											}
										/>
									</div>
								)}
							</form.Subscribe>

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

							<div className="rounded-lg border p-4 space-y-3">
								<div className="flex items-center justify-between">
									<div>
										<FieldLabel className="text-base">
											Utility charges
										</FieldLabel>
										<p className="text-xs text-muted-foreground">
											For the new month ({periodLabel})
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
												isPaid: false,
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
													No utility charges added. The new month will only
													include the room rate.
												</p>
											);
										}
										return (
											<div className="space-y-3">
												{field.state.value.map((_, index) => (
													<UtilityRow
														// biome-ignore lint/suspicious/noArrayIndexKey: tanstack-form array field, items have no stable id
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

							<form.Subscribe
								selector={(state) => ({
									withCashAdvance: state.values.withCashAdvance,
									utilitiesTotal: state.values.utilities.reduce(
										(sum, u) =>
											sum + (Number.isFinite(u.amount) ? u.amount : 0),
										0,
									),
								})}
							>
								{({ withCashAdvance, utilitiesTotal }) => {
									const total = withCashAdvance
										? utilitiesTotal
										: monthlyTotal + utilitiesTotal;
									return (
										<div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Extension</span>
												<span className="font-medium">
													{months} month{months > 1 ? "s" : ""} (
													{formatPeso(monthlyPrice)} × {months})
												</span>
											</div>
											{utilitiesTotal > 0 && (
												<div className="flex justify-between">
													<span className="text-muted-foreground">
														Utilities
													</span>
													<span className="font-medium">
														{formatPeso(utilitiesTotal)}
													</span>
												</div>
											)}
											<div className="flex justify-between border-t pt-2 font-semibold">
												<span>Total due now</span>
												<span>{formatPeso(total)}</span>
											</div>
										</div>
									);
								}}
							</form.Subscribe>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								type="button"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<form.SubmitButton label="Extend Booking" />
						</DialogFooter>
					</form.AppForm>
				</form>
			</DialogOutsideScroll>
		</Dialog>
	);
}
