import type { rooms } from "@/db/schema";
import {
	calculateReservationFee,
	calculateStayPricing,
	formatPeso,
} from "@/lib/bookings/stay-pricing";

import type { CreateBookingForm } from "./create-booking-form.types";

type Room = typeof rooms.$inferSelect;

type CreateBookingPricingSummaryProps = {
	form: CreateBookingForm;
	rooms: Room[];
	walkIn: boolean;
};

export function CreateBookingPricingSummary({
	form,
	rooms,
	walkIn,
}: CreateBookingPricingSummaryProps) {
	return (
		<form.Subscribe
			selector={(state) => ({
				roomId: state.values.roomId,
				bookingType: state.values.bookingType,
				checkInDate: state.values.checkInDate,
				checkOutDate: state.values.checkOutDate,
				checkInTime: state.values.checkInTime,
				checkOutTime: state.values.checkOutTime,
				reservationFeeType: state.values.reservationFeeType,
				reservationFeeValue: state.values.reservationFeeValue,
				monthlyDuration: state.values.monthlyDuration,
				hasAdvance: state.values.hasAdvance,
			})}
		>
			{({
				roomId,
				bookingType,
				checkInDate: start,
				checkOutDate: end,
				checkInTime,
				checkOutTime,
				reservationFeeType,
				reservationFeeValue,
				monthlyDuration,
				hasAdvance,
			}) => {
				const selectedRoom = rooms.find(
					(room) => room.id.toString() === roomId,
				);
				if (!selectedRoom) return null;

				const isMonthly = bookingType === "MONTHLY";

				if (isMonthly) {
					if (!start) return null;

					const monthlyPrice = Number(selectedRoom.monthlyPrice) || 0;
					if (monthlyPrice <= 0) return null;

					const duration = monthlyDuration || 1;
					const reservationFee =
						reservationFeeType != null
							? calculateReservationFee({
									total: monthlyPrice,
									feeType: reservationFeeType,
									feeValue: reservationFeeValue ?? 0,
								})
							: 0;
					const firstMonthBalance = Math.max(0, monthlyPrice - reservationFee);
					const advanceAmount = hasAdvance ? monthlyPrice : 0;
					const totalStay = monthlyPrice * duration;

					if (walkIn) {
						return (
							<div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{duration} month{duration === 1 ? "" : "s"} rent
									</span>
									<span className="font-medium">{formatPeso(totalStay)}</span>
								</div>
								{reservationFee > 0 && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Reservation fee (due now)
										</span>
										<span className="font-medium">
											{formatPeso(reservationFee)}
										</span>
									</div>
								)}
								<div className="mt-2 flex justify-between border-t pt-2 font-semibold">
									<span>Amount due now</span>
									<span>{formatPeso(totalStay)}</span>
								</div>
							</div>
						);
					}

					return (
						<div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Stay total ({duration} month{duration === 1 ? "" : "s"})
								</span>
								<span className="font-medium">{formatPeso(totalStay)}</span>
							</div>
							{reservationFee > 0 && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Reservation fee (due now)
									</span>
									<span className="font-medium">
										{formatPeso(reservationFee)}
									</span>
								</div>
							)}
							{firstMonthBalance > 0 && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										1st month balance (due at check-in)
									</span>
									<span className="font-medium">
										{formatPeso(firstMonthBalance)}
									</span>
								</div>
							)}
							{advanceAmount > 0 && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										2nd month advance (due at check-in)
									</span>
									<span className="font-medium">
										{formatPeso(advanceAmount)}
									</span>
								</div>
							)}
							<div className="mt-2 flex justify-between border-t pt-2 font-semibold">
								<span>Amount due now</span>
								<span>{formatPeso(reservationFee)}</span>
							</div>
						</div>
					);
				}

				if (!start || !end) return null;

				const { nights, subtotal } = calculateStayPricing({
					basePrice: selectedRoom.basePrice,
					checkIn: `${start}T${checkInTime}`,
					checkOut: `${end}T${checkOutTime}`,
				});

				if (walkIn) {
					return (
						<div className="rounded-lg border bg-muted/40 p-4 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Stay total ({nights} night
									{nights === 1 ? "" : "s"})
								</span>
								<span className="font-medium">{formatPeso(subtotal)}</span>
							</div>
							<div className="mt-2 flex justify-between border-t pt-2 font-semibold">
								<span>Amount due now</span>
								<span>{formatPeso(subtotal)}</span>
							</div>
						</div>
					);
				}

				const deposit = calculateReservationFee({
					total: subtotal,
					feeType: reservationFeeType ?? "PERCENT",
					feeValue: reservationFeeValue ?? 0,
				});
				const balance = Math.max(0, subtotal - deposit);

				return (
					<div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Stay total ({nights} night
								{nights === 1 ? "" : "s"})
							</span>
							<span className="font-medium">{formatPeso(subtotal)}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Reservation fee (due now)
							</span>
							<span className="font-medium">{formatPeso(deposit)}</span>
						</div>
						<div className="flex justify-between border-t pt-2 font-semibold">
							<span>Balance due at check-in</span>
							<span>{formatPeso(balance)}</span>
						</div>
					</div>
				);
			}}
		</form.Subscribe>
	);
}
