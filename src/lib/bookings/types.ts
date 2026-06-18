import type { bookings } from "@/db/schema";
import type {
	BookingPaymentStatus,
	BookingStatus,
	BookingType,
} from "@/db/schema/enums";

export type { BookingPaymentStatus, BookingStatus, BookingType };

export type BookingWithRoom = {
	id: number;
	bookingRef: string;
	firstName: string;
	lastName: string;
	contactNumber: string | null;
	address: string;
	roomId: number;
	roomNumber: string;
	roomType: string;
	roomBasePrice: string | null;
	roomMonthlyPrice: string | null;
	transferredFromBookingRef: string | null;
	checkIn: string;
	checkOut: string;
	occupantsCount: number;
	status: BookingStatus;
	paymentStatus: BookingPaymentStatus;
	bookingType: BookingType;
	depositDeadline: string | Date | null;
	finalDueDate: string | Date | null;
	depositPctSnapshot: string;
	cancellationReason: string | null;
	cancelledAt: string | Date | null;
	createdAt: string | Date | null;
	deletedAt: string | Date | null;
};

export type TimelineLegendStatus = "RESERVED" | "CHECKED_IN" | "CHECKED_OUT";

export type BookingRow = typeof bookings.$inferSelect;

export function formatGuestName(booking: {
	firstName: string;
	lastName: string;
}): string {
	return `${booking.firstName} ${booking.lastName}`.trim();
}
