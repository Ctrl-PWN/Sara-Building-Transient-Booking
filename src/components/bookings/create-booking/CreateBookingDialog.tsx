import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogFooter,
	DialogHeader,
	DialogOutsideScroll,
	DialogTitle,
} from "@/components/ui/dialog";
import type { rooms } from "@/db/schema";
import { bookingMutations } from "@/lib/bookings/bookings.mutations";
import { createBookingFormDefaultValues } from "@/lib/bookings/schemas";
import type { BookingWithRoom } from "@/lib/bookings/types";

import { CreateBookingPaymentSection } from "./CreateBookingPaymentSection";
import { CreateBookingPricingSummary } from "./CreateBookingPricingSummary";
import { CreateBookingReservationSection } from "./CreateBookingReservationSection";
import { CreateBookingStayFields } from "./CreateBookingStayFields";
import { useCreateBookingAvailability } from "./useCreateBookingAvailability";
import { useCreateBookingForm } from "./useCreateBookingForm";

type Room = typeof rooms.$inferSelect;

type CreateBookingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	rooms: Room[];
	bookings: BookingWithRoom[];
	walkIn: boolean;
	onSuccess: (bookingRef: string) => void;
	onError: (error: string) => void;
};

export function CreateBookingDialog({
	open,
	onOpenChange,
	rooms,
	bookings,
	walkIn,
	onSuccess,
	onError,
}: CreateBookingDialogProps) {
	const queryClient = useQueryClient();

	const mutation = useMutation(
		bookingMutations.createBooking(queryClient, onSuccess, onError),
	);

	const form = useCreateBookingForm({
		walkIn,
		onSubmit: async (value) => {
			await mutation.mutateAsync({
				roomId: Number(value.roomId),
				firstName: value.firstName.trim(),
				lastName: value.lastName.trim(),
				contactNumber: value.contactNumber?.trim() || undefined,
				address: value.address.trim(),
				checkInDate: value.checkInDate,
				checkOutDate: value.checkOutDate,
				occupantsCount: value.occupantsCount,
				walkIn: value.walkIn,
				paymentMethod: value.paymentMethod,
				referenceNumber:
					value.paymentMethod === "CASH"
						? undefined
						: value.referenceNumber.trim() || undefined,
				reservationFeeType: value.walkIn ? undefined : value.reservationFeeType,
				reservationFeeValue: value.walkIn
					? undefined
					: value.reservationFeeValue,
				depositPercentage: value.walkIn
					? 100
					: value.reservationFeeType === "PERCENT"
						? value.reservationFeeValue
						: 0,
			});
		},
	});

	const resetForm = useCallback(() => {
		form.reset(createBookingFormDefaultValues(walkIn));
	}, [form, walkIn]);

	useEffect(() => {
		if (open) {
			form.reset(createBookingFormDefaultValues(walkIn));
		}
	}, [open, walkIn, form]);

	const { checkInDate, checkOutDate } = form.state.values;

	const { roomOptions, isDateFullyBooked } = useCreateBookingAvailability({
		rooms,
		bookings,
		checkInDate,
		checkOutDate,
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(newOpen) => {
				if (!newOpen) {
					resetForm();
				}
				onOpenChange(newOpen);
			}}
		>
			<DialogOutsideScroll className="sm:max-w-2xl">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.AppForm>
						<DialogHeader>
							<DialogTitle>
								{walkIn ? "Walk-in Booking" : "New Reservation"}
							</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<CreateBookingStayFields
								form={form}
								roomOptions={roomOptions}
								isDateFullyBooked={isDateFullyBooked}
							/>

							{!walkIn ? <CreateBookingReservationSection form={form} /> : null}

							<CreateBookingPaymentSection form={form} />

							<CreateBookingPricingSummary
								form={form}
								rooms={rooms}
								walkIn={walkIn}
							/>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								type="button"
								onClick={() => {
									resetForm();
									onOpenChange(false);
								}}
							>
								Cancel
							</Button>
							<form.SubmitButton
								label={walkIn ? "Check In Walk-in" : "Create Booking"}
							/>
						</DialogFooter>
					</form.AppForm>
				</form>
			</DialogOutsideScroll>
		</Dialog>
	);
}
