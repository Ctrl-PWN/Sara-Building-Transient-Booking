import { format } from "date-fns";

import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatGuestName } from "@/lib/bookings/types";
import type { MonthlyBillingPeriod } from "@/lib/bookings/monthly-billing-periods";
import type { MonthlyInvoiceUtilityLine } from "@/lib/invoices/schemas";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

export type ReceiptLineItem = {
	id: string;
	label: string;
	meta?: string;
	amount: number;
	badge?: string;
	isPaid?: boolean;
};

export type ReceiptKvRow = {
	label: string;
	value: string;
};

export type ReceiptTotals = {
	totalCharges?: number;
	totalPaid?: number;
	totalDue: number;
	balanceLabel?: string;
};

export type ReceiptModel = {
	documentTitle: string;
	documentRef: string;
	guestName: string;
	bookingRef: string;
	issuedAt: string;
	issuedBy: string;
	kvRows: ReceiptKvRow[];
	lineItems: ReceiptLineItem[];
	totals: ReceiptTotals;
	footerText?: string;
};

function formatCategory(category: string): string {
	return category
		.split("_")
		.map((part) => part.charAt(0) + part.slice(1).toLowerCase())
		.join(" ");
}

function formatPaymentMethod(method: string | null): string {
	if (!method) return "";
	if (method === "BANK_TRANSFER") return "Bank transfer";
	return method.charAt(0) + method.slice(1).toLowerCase();
}

export function buildLedgerReceiptModel(args: {
	booking: BookingWithRoom;
	transactions: LedgerTransactionListItem[];
	total: number;
	payments: number;
	remainingBalance: number;
	issuedBy: string;
}): ReceiptModel {
	const { booking, transactions, total, payments, remainingBalance, issuedBy } =
		args;
	const issuedAt = format(new Date(), "MMM d, yyyy h:mm a");

	const kvRows: ReceiptKvRow[] = [
		{ label: "Guest", value: formatGuestName(booking) },
	];
	if (booking.contactNumber) {
		kvRows.push({ label: "Contact", value: booking.contactNumber });
	}
	kvRows.push({ label: "Booking", value: booking.bookingRef });
	if (booking.checkIn) {
		kvRows.push({
			label: "Check-in",
			value: format(new Date(booking.checkIn), "MMM d, h:mm a"),
		});
	}
	kvRows.push({
		label: "Check-out",
		value: format(new Date(booking.checkOut), "MMM d, h:mm a"),
	});
	kvRows.push({ label: "Issued", value: issuedAt });
	kvRows.push({ label: "Issued by", value: issuedBy });

	const lineItems: ReceiptLineItem[] = transactions.map((tx) => {
		const paymentMeta = tx.paymentMethod
			? formatPaymentMethod(tx.paymentMethod)
			: "";
		const refMeta = tx.referenceNumber ? ` · ${tx.referenceNumber}` : "";
		const dateMeta = format(new Date(tx.createdAt), "MMM d, h:mm a");
		const meta = [dateMeta, paymentMeta + refMeta].filter(Boolean).join(" · ");

		return {
			id: String(tx.id),
			label: tx.description ?? formatCategory(tx.category),
			meta: meta || undefined,
			amount: Number(tx.amount),
			isPaid: tx.isPaid,
		};
	});

	return {
		documentTitle: "RECEIPT",
		documentRef: `INV-${booking.bookingRef}`,
		guestName: formatGuestName(booking),
		bookingRef: booking.bookingRef,
		issuedAt,
		issuedBy,
		kvRows,
		lineItems,
		totals: {
			totalCharges: total,
			totalPaid: payments,
			totalDue: remainingBalance,
			balanceLabel: "BALANCE",
		},
		footerText: "Thank you for your stay.",
	};
}

export function buildMonthlyInvoiceReceiptModel(args: {
	booking: BookingWithRoom;
	period: MonthlyBillingPeriod;
	roomCharge: number;
	utilities: MonthlyInvoiceUtilityLine[];
	issuedBy: string;
}): ReceiptModel {
	const { booking, period, roomCharge, utilities, issuedBy } = args;
	const issuedAt = format(new Date(), "MMM d, yyyy h:mm a");
	const totalDue = roomCharge + utilities.reduce((sum, u) => sum + u.amount, 0);

	const kvRows: ReceiptKvRow[] = [
		{ label: "Guest", value: formatGuestName(booking) },
	];
	if (booking.contactNumber) {
		kvRows.push({ label: "Contact", value: booking.contactNumber });
	}
	kvRows.push({ label: "Booking", value: booking.bookingRef });
	kvRows.push({ label: "Room", value: `${booking.roomNumber} (${booking.roomType})` });
	kvRows.push({ label: "Billing period", value: period.label });
	kvRows.push({ label: "Issued", value: issuedAt });
	kvRows.push({ label: "Issued by", value: issuedBy });

	const lineItems: ReceiptLineItem[] = [
		{
			id: "room",
			label: "Monthly room charge",
			meta: period.label,
			amount: roomCharge,
		},
		...utilities.map((u, index) => ({
			id: `utility-${index}`,
			label: u.description,
			meta: u.utilityType,
			amount: u.amount,
			badge: u.utilityType,
		})),
	];

	return {
		documentTitle: "INVOICE",
		documentRef: `INV-${booking.bookingRef}-P${period.index + 1}`,
		guestName: formatGuestName(booking),
		bookingRef: booking.bookingRef,
		issuedAt,
		issuedBy,
		kvRows,
		lineItems,
		totals: {
			totalDue,
			balanceLabel: "TOTAL DUE",
		},
		footerText: "Thank you for your stay.",
	};
}

export function formatReceiptAmount(amount: number): string {
	return formatPeso(amount);
}
