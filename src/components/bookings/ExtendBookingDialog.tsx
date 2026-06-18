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
import { FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useAppForm } from "@/integrations/tanstack-form";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";

const extendFormSchema = z.object({
	withCashAdvance: z.boolean(),
	paymentMethod: z.enum(["CASH", "GCASH", "BANK_TRANSFER"]),
	referenceNumber: z.string(),
});

type ExtendBookingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	booking: BookingWithRoom;
	onConfirm: (
		withCashAdvance: boolean,
		paymentMethod: string,
		referenceNumber: string,
	) => void;
};

function computeNewCheckOut(currentCheckOut: string): Date {
	const current = new Date(currentCheckOut);
	const targetMonth = current.getMonth() + 1;
	const targetYear = current.getFullYear();
	const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
	const day = Math.min(current.getDate(), lastDayOfMonth);
	return new Date(targetYear, targetMonth, day, 12, 0, 0);
}

export function ExtendBookingDialog({
	open,
	onOpenChange,
	booking,
	onConfirm,
}: ExtendBookingDialogProps) {
	const monthlyPrice = Number(booking.roomMonthlyPrice) || 0;
	const newCheckOut = computeNewCheckOut(booking.checkOut);

	type FormValues = z.infer<typeof extendFormSchema>;

	const defaultValues: FormValues = {
		withCashAdvance: true,
		paymentMethod: "CASH",
		referenceNumber: "",
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: extendFormSchema },
		onSubmit: async ({ value }) => {
			onConfirm(
				value.withCashAdvance,
				value.paymentMethod,
				value.referenceNumber,
			);
		},
	});

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
										{format(newCheckOut, "MMM d, yyyy")}
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

							<form.Subscribe
								selector={(state) => state.values.withCashAdvance}
							>
								{(withCashAdvance) => (
									<>
										<div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
											{withCashAdvance && (
												<div className="flex justify-between text-green-600">
													<span>Cash advance (due now)</span>
													<span className="font-medium">
														{formatPeso(monthlyPrice)}
													</span>
												</div>
											)}
											<div className="flex justify-between border-t pt-2 font-semibold">
												<span>
													{withCashAdvance
														? "Balance due at check-in"
														: "Amount due now"}
												</span>
												<span>
													{formatPeso(withCashAdvance ? 0 : monthlyPrice)}
												</span>
											</div>
										</div>

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
												onCheckedChange={(checked) => {
													form.setFieldValue("withCashAdvance", checked);
												}}
											/>
										</div>
									</>
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
