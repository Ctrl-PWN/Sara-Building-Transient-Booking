import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

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
import {
	createBookingFormDefaultValues,
	todayIsoDate,
} from "@/lib/bookings/schemas";
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

const STEPS = ["Room", "Dates", "Details"] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
	return (
		<div className="flex items-center gap-2 text-xs">
			{STEPS.map((label, i) => {
				const stepNum = i + 1;
				const isActive = stepNum === currentStep;
				const isComplete = stepNum < currentStep;
				return (
					<div key={label} className="flex items-center gap-2">
						{i > 0 && (
							<div
								className={`h-px w-4 ${isComplete ? "bg-primary" : "bg-border"}`}
							/>
						)}
						<div className="flex items-center gap-1.5">
							<div
								className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
									isActive
										? "bg-primary text-primary-foreground"
										: isComplete
											? "bg-primary/20 text-primary"
											: "bg-muted text-muted-foreground"
								}`}
							>
								{stepNum}
							</div>
							<span
								className={
									isActive
										? "font-medium text-foreground"
										: "text-muted-foreground"
								}
							>
								{label}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}

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
	const [step, setStep] = useState(1);

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
				contactNumber: value.contactNumber.trim() || undefined,
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
		setStep(1);
	}, [form, walkIn]);

	useEffect(() => {
		if (open) {
			form.reset(createBookingFormDefaultValues(walkIn));
			setStep(1);
		}
	}, [open, walkIn, form]);

	const { roomOptions, getBookedDatesForRoom } = useCreateBookingAvailability({
		rooms,
		bookings,
		walkIn,
	});

	const selectedRoomId = useStore(form.store, (s) => s.values.roomId);
	const formCheckInDate = useStore(form.store, (s) => s.values.checkInDate);
	const formCheckOutDate = useStore(form.store, (s) => s.values.checkOutDate);

	const prevRoomIdRef = useRef(selectedRoomId);

	useEffect(() => {
		if (
			prevRoomIdRef.current !== selectedRoomId &&
			prevRoomIdRef.current !== ""
		) {
			form.setFieldValue("checkInDate", "");
			form.setFieldValue("checkOutDate", "");
			if (walkIn) {
				form.setFieldValue("checkInDate", todayIsoDate());
			}
		}
		prevRoomIdRef.current = selectedRoomId;
	}, [selectedRoomId, form, walkIn]);

	const isDateDisabled = useCallback(
		(date: Date) => {
			if (!selectedRoomId) return false;
			const t = new Date(date);
			t.setHours(0, 0, 0, 0);
			const bookedDates = getBookedDatesForRoom(Number(selectedRoomId));
			return bookedDates.has(t.getTime());
		},
		[selectedRoomId, getBookedDatesForRoom],
	);

	const canProceed =
		(step === 1 && !!selectedRoomId) ||
		(step === 2 && !!formCheckInDate && !!formCheckOutDate);

	const handleNext = () => {
		if (step === 1 && selectedRoomId) {
			if (walkIn) {
				form.setFieldValue("checkInDate", todayIsoDate());
			}
			setStep(2);
		} else if (step === 2 && formCheckInDate && formCheckOutDate) {
			setStep(3);
		}
	};

	const handleBack = () => {
		if (step === 2) {
			setStep(1);
		} else if (step === 3) {
			setStep(2);
		}
	};

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
							<div className="flex items-center justify-between">
								<DialogTitle>
									{walkIn ? "Walk-in Booking" : "New Reservation"}
								</DialogTitle>
								<StepIndicator currentStep={step} />
							</div>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<CreateBookingStayFields
								form={form}
								step={step}
								roomOptions={roomOptions}
								isDateDisabled={isDateDisabled}
							/>

							{step === 3 && !walkIn && (
								<CreateBookingReservationSection form={form} />
							)}

							{step === 3 && <CreateBookingPaymentSection form={form} />}

							{step === 3 && (
								<CreateBookingPricingSummary
									form={form}
									rooms={rooms}
									walkIn={walkIn}
								/>
							)}
						</div>
						<DialogFooter>
							{step > 1 && (
								<Button variant="outline" type="button" onClick={handleBack}>
									Back
								</Button>
							)}
							{step < 3 ? (
								<Button
									type="button"
									onClick={handleNext}
									disabled={!canProceed}
								>
									Next
								</Button>
							) : (
								<form.SubmitButton
									label={walkIn ? "Check In Walk-in" : "Create Booking"}
								/>
							)}
						</DialogFooter>
					</form.AppForm>
				</form>
			</DialogOutsideScroll>
		</Dialog>
	);
}
