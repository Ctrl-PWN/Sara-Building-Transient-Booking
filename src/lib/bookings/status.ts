import type { TimelineLegendStatus } from "./types";

export type BookingStatusPresentation = {
	label: string;
	legendLabel: string;
	colorVar: string;
};

export type DerivedBookingStatus =
	| TimelineLegendStatus
	| "OVERDUE"
	| "TRANSFERRED";

const presentationByStatus: Record<
	DerivedBookingStatus,
	BookingStatusPresentation
> = {
	RESERVED: {
		label: "Reserved",
		legendLabel: "Reserved",
		colorVar: "--status-reserved",
	},
	CHECKED_IN: {
		label: "Checked-In",
		legendLabel: "Checked-In",
		colorVar: "--status-occupied",
	},
	CHECKED_OUT: {
		label: "Checked-Out",
		legendLabel: "Checked-Out",
		colorVar: "--status-checked-out",
	},
	OVERDUE: {
		label: "Overdue",
		legendLabel: "Overdue",
		colorVar: "--status-overdue",
	},
	TRANSFERRED: {
		label: "Transferred",
		legendLabel: "Transferred",
		colorVar: "--status-checked-out",
	},
};

export const timelineLegendStatuses: TimelineLegendStatus[] = [
	"RESERVED",
	"CHECKED_IN",
	"CHECKED_OUT",
];

export function normalizeBookingStatus(status: string): TimelineLegendStatus {
	if (status === "CHECKED_IN") return "CHECKED_IN";
	if (status === "CHECKED_OUT" || status === "TRANSFERRED")
		return "CHECKED_OUT";
	return "RESERVED";
}

export function computeBookingDisplayStatus(
	status: string,
	checkOut: string | Date,
): DerivedBookingStatus {
	if (status === "CHECKED_IN") {
		const checkout = new Date(checkOut);
		const now = new Date();
		if (now > checkout) return "OVERDUE";
	}
	if (
		status === "CHECKED_IN" ||
		status === "CHECKED_OUT" ||
		status === "RESERVED" ||
		status === "TRANSFERRED"
	) {
		return status;
	}
	return status as DerivedBookingStatus;
}

export function getBookingStatusPresentation(
	status: string,
): BookingStatusPresentation {
	if (Object.hasOwn(presentationByStatus, status)) {
		return presentationByStatus[status as DerivedBookingStatus];
	}
	return presentationByStatus[normalizeBookingStatus(status)];
}

export function formatPaymentStatus(paymentStatus: string): string {
	return paymentStatus
		.toLowerCase()
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}
