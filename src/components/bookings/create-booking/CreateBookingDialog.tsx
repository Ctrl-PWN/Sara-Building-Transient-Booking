import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

function computeMonthlyDates(
	checkInDate: string,
	checkInTime: string,
	durationMonths: number,
): { checkIn: string; checkOut: string } {
	const checkIn = new Date(`${checkInDate}T${checkInTime}`);

	const date = new Date(checkInDate);
	const targetMonth = date.getMonth() + durationMonths;
	const targetYear = date.getFullYear();
	const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
	const day = Math.min(date.getDate(), lastDayOfMonth);
	const checkOut = new Date(targetYear, targetMonth, day, 12, 0, 0);

	return {
		checkIn: checkIn.toISOString(),
		checkOut: checkOut.toISOString(),
	};
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
			const isMonthly = value.bookingType === "MONTHLY";
			let checkIn: string;
			let checkOut: string;
			let feeType: "PERCENT" | "FIXED" = "PERCENT";
			let feeValue = 0;
			let depositPercentage = 0;

			if (isMonthly) {
				if (value.walkIn) {
					checkIn = `${value.checkInDate}T${value.checkInTime}`;
					checkOut = `${value.checkOutDate}T${value.checkOutTime}`;
				} else {
					const dates = computeMonthlyDates(
						value.checkInDate,
						value.checkInTime,
						value.monthlyDuration || 1,
					);
					checkIn = dates.checkIn;
					checkOut = dates.checkOut;
				}

				feeType = value.cashAdvanceType ?? "PERCENT";
				feeValue = value.cashAdvanceValue ?? 0;

				const selectedRoom = rooms.find(
					(r) => r.id.toString() === value.roomId,
				);
				const monthlyPrice = Number(selectedRoom?.monthlyPrice) || 0;
				const subtotal = monthlyPrice;
				const depositAmount =
					feeType === "PERCENT" ? (subtotal * feeValue) / 100 : feeValue;
				depositPercentage = subtotal > 0 ? (depositAmount / subtotal) * 100 : 0;
			} else {
				checkIn = `${value.checkInDate}T${value.checkInTime}`;
				checkOut = `${value.checkOutDate}T${value.checkOutTime}`;
				feeType = value.walkIn
					? "PERCENT"
					: (value.reservationFeeType ?? "PERCENT");
				feeValue = value.walkIn ? 0 : (value.reservationFeeValue ?? 0);
				depositPercentage = value.walkIn
					? 100
					: feeType === "PERCENT"
						? feeValue
						: 0;
			}

			await mutation.mutateAsync({
				roomId: Number(value.roomId),
				firstName: value.firstName.trim(),
				lastName: value.lastName.trim(),
				contactNumber: value.contactNumber.trim() || undefined,
				checkIn,
				checkOut,
				address: value.address?.trim() || "",
				occupantsCount: value.occupantsCount,
				walkIn: value.walkIn,
				bookingType: value.bookingType,
				paymentMethod: value.paymentMethod,
				referenceNumber:
					value.paymentMethod === "CASH"
						? undefined
						: value.referenceNumber.trim() || undefined,
				reservationFeeType: feeType,
				reservationFeeValue: feeValue,
				depositPercentage,
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

	const selectedRoomId = useSelector(form.store, (s) => s.values.roomId);
	const bookingType = useSelector(form.store, (s) => s.values.bookingType);
	const formCheckInDate = useSelector(form.store, (s) => s.values.checkInDate);
	const formCheckOutDate = useSelector(
		form.store,
		(s) => s.values.checkOutDate,
	);

	const { roomOptions, getBookedDatesForRoom } = useCreateBookingAvailability({
		rooms,
		bookings,
		walkIn,
		bookingType,
	});

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

	const isMonthly = bookingType === "MONTHLY";
	const hasCheckInDate = !!formCheckInDate;

	const canProceed =
		(step === 1 && !!selectedRoomId) ||
		(step === 2 &&
			(isMonthly
				? hasCheckInDate && (walkIn ? !!formCheckOutDate : true)
				: hasCheckInDate && !!formCheckOutDate));

	const handleNext = () => {
		if (step === 1 && selectedRoomId) {
			if (walkIn) {
				form.setFieldValue("checkInDate", todayIsoDate());
			}
			setStep(2);
		} else if (step === 2) {
			if (isMonthly) {
				if (formCheckInDate && (walkIn ? !!formCheckOutDate : true)) {
					setStep(3);
				}
			} else if (hasCheckInDate && formCheckOutDate) {
				setStep(3);
			}
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

						const missing: string[] = [];
						const missingFields: string[] = [];
						if (!form.getFieldValue("firstName").trim()) {
							missing.push("First name");
							missingFields.push("firstName");
						}
						if (!form.getFieldValue("lastName").trim()) {
							missing.push("Last name");
							missingFields.push("lastName");
						}
						if (!form.getFieldValue("contactNumber").trim()) {
							missing.push("Phone number");
							missingFields.push("contactNumber");
						}
						if (!(form.getFieldValue("address") || "").trim()) {
							missing.push("Address");
							missingFields.push("address");
						}

						if (missing.length > 0) {
							for (const f of missingFields) {
								form.setFieldMeta(
									f as "firstName" | "lastName" | "contactNumber" | "address",
									(prev) => ({
										...prev,
										isTouched: true,
										isDirty: true,
										errorMap: {
											...prev.errorMap,
											onSubmit: "This field is required",
										},
									}),
								);
							}
							toast.error("Please fill in the required fields", {
								description: missing.join(", "),
							});
							return;
						}

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
								bookings={bookings}
							/>

							{step === 3 && (!walkIn || isMonthly) && (
								<CreateBookingReservationSection form={form} rooms={rooms} />
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
