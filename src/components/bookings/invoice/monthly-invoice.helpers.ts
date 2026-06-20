import type { MonthlyBillingPeriod } from "@/lib/bookings/monthly-billing-periods";
import type { BookingWithRoom } from "@/lib/bookings/types";
import type { MonthlyInvoiceUtilityLine } from "@/lib/invoices/schemas";

export type MonthlyInvoiceDocumentProps = {
	booking: BookingWithRoom;
	period: MonthlyBillingPeriod;
	roomCharge: number;
	utilities: MonthlyInvoiceUtilityLine[];
	issuedBy: string;
};

export function getMonthlyInvoiceRef(bookingRef: string, periodIndex: number) {
	return `INV-${bookingRef}-P${periodIndex + 1}`;
}
