import { useSelector } from "@tanstack/react-store";
import { format } from "date-fns";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogFooter,
	DialogHeader,
	DialogOutsideScroll,
	DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAppForm } from "@/integrations/tanstack-form";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";

const extendFormSchema = z.object({
	useCustomDate: z.boolean(),
	newCheckOutDate: z.string().min(1, "Checkout date is required"),
	paymentMethod: z.enum(["CASH", "GCASH", "BANK_TRANSFER"]),
	referenceNumber: z.string(),
});

type ExtendBookingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	booking: BookingWithRoom;
	onConfirm: (
		newCheckOutDate: string,
		paymentMethod: string,
		referenceNumber: string,
	) => void;
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

function computeMonthsBetween(currentCheckOut: string, newCheckOut: string): number {
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

	type FormValues = z.infer<typeof extendFormSchema>;

	const defaultValues: FormValues = {
		useCustomDate: false,
		newCheckOutDate: defaultCheckOut,
		paymentMethod: "CASH",
		referenceNumber: "",
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: extendFormSchema },
		onSubmit: async ({ value }) => {
			onConfirm(value.newCheckOutDate, value.paymentMethod, value.referenceNumber);
		},
	});

	const useCustomDate = useSelector(
		form.store,
		(state) => (state.values as FormValues).useCustomDate,
	);

	const resolvedCheckOut = useCustomDate
		? form.state.values.newCheckOutDate
		: defaultCheckOut;
	const months = computeMonthsBetween(booking.checkOut, resolvedCheckOut);
	const totalDue = monthlyPrice * months;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogOutsideScroll className="sm:max-w-md">
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
										{format(new Date(booking.checkOut), "MMM d, yyyy")}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">New checkout</span>
									<span className="font-medium">
										{resolvedCheckOut
											? format(new Date(resolvedCheckOut), "MMM d, yyyy")
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
									<span className="font-medium text-sm">Change checkout date</span>
									<span className="text-xs text-muted-foreground">
										Pick a custom checkout date
									</span>
								</div>
								<Switch
									checked={useCustomDate}
									onCheckedChange={(checked) => {
										form.setFieldValue("useCustomDate", checked);
										if (!checked) {
											form.setFieldValue("newCheckOutDate", defaultCheckOut);
										}
									}}
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

							<div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Extension</span>
									<span className="font-medium">
										{months} month{months > 1 ? "s" : ""}
									</span>
								</div>
								<div className="flex justify-between border-t pt-2 font-semibold">
									<span>Amount due now</span>
									<span>{formatPeso(totalDue)}</span>
								</div>
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
