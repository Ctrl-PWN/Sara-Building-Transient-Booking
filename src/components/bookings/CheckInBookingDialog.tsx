import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOutsideScroll,
	DialogTitle,
} from "@/components/ui/dialog";
import type { PaymentMethod } from "@/db/schema/enums";
import {
	dynamicSchemaValidators,
	useAppForm,
} from "@/integrations/tanstack-form";
import { bookingMutations } from "@/lib/bookings/bookings.mutations";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatManilaDateTime } from "@/lib/date/manila";
import { ledgerQueries } from "@/lib/ledger/ledger.queries";
import { ledgerPaymentFieldsSchema } from "@/lib/ledger/schemas";

import { LedgerPaymentFieldsSection } from "./ledger/LedgerPaymentFieldsSection";

type CheckInBookingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	booking: BookingWithRoom;
	bookingId: number;
};

export function CheckInBookingDialog({
	open,
	onOpenChange,
	booking,
	bookingId,
}: CheckInBookingDialogProps) {
	const queryClient = useQueryClient();
	const { data: transactions } = useSuspenseQuery(
		ledgerQueries.transactions(bookingId),
	);

	const unpaidBalances = transactions.filter(
		(row) =>
			!row.isPaid &&
			(row.category === "ROOM_CHARGE" || row.category === "ADVANCE"),
	);

	const mutation = useMutation(
		bookingMutations.checkIn(queryClient, bookingId),
	);

	const form = useAppForm({
		defaultValues: {
			paymentMethod: "CASH" as PaymentMethod,
			referenceNumber: "",
		},
		...dynamicSchemaValidators(ledgerPaymentFieldsSchema),
		onSubmit: async ({ value }) => {
			try {
				await mutation.mutateAsync({
					bookingRef: booking.bookingRef,
					paymentMethod: value.paymentMethod,
					referenceNumber: value.referenceNumber,
				});
				form.reset();
				onOpenChange(false);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to check in guest";
				toast.error("Check-in failed", { description: message });
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset();
		}
	}, [open, form]);

	const balanceAmount = unpaidBalances.reduce(
		(sum, row) => sum + Number(row.amount),
		0,
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogOutsideScroll className="sm:max-w-lg">
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Check in guest</DialogTitle>
					</DialogHeader>
					<form
						className="space-y-4 py-2"
						onSubmit={(event) => {
							event.preventDefault();
							void form.handleSubmit();
						}}
					>
						<form.AppForm>
							<div className="rounded-lg border p-4 space-y-2 text-sm">
								<p>
									<span className="text-muted-foreground">Guest:</span>{" "}
									{booking.firstName} {booking.lastName}
								</p>
								<p>
									<span className="text-muted-foreground">Room:</span>{" "}
									{booking.roomNumber}
								</p>
								<p>
									<span className="text-muted-foreground">Stay:</span>{" "}
									{formatManilaDateTime(booking.checkIn, "MMM d, yyyy 'at' HH:mm")}{" "}
									–{" "}
									{formatManilaDateTime(booking.checkOut, "MMM d, yyyy 'at' HH:mm")}
								</p>
								{unpaidBalances.length > 0 && (
									<div className="pt-1 space-y-1">
										{unpaidBalances.map((row) => (
											<p
												key={row.id}
												className="flex justify-between text-muted-foreground"
											>
												<span>{row.description ?? row.category}</span>
												<span>{formatPeso(Number(row.amount))}</span>
											</p>
										))}
									</div>
								)}
								<p className="font-medium pt-1 border-t">
									Total balance due: {formatPeso(balanceAmount)}
								</p>
							</div>

							<p className="text-sm text-muted-foreground">
								Collect the full room balance before checking the guest in.
							</p>

							<LedgerPaymentFieldsSection form={form} />

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									Cancel
								</Button>
								<form.SubmitButton label="Check in & record payment" />
							</DialogFooter>
						</form.AppForm>
					</form>
				</DialogContent>
			</DialogOutsideScroll>
		</Dialog>
	);
}
