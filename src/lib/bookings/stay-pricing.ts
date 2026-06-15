export type ReservationFeeType = "PERCENT" | "FIXED";

export type StayPricingInput = {
	basePrice: number | string;
	checkInDate: string;
	checkOutDate: string;
	checkInTime?: string;
	checkOutTime?: string;
};

export type StayPricingResult = {
	nights: number;
	subtotal: number;
};

export type ReservationFeeInput = {
	total: number;
	feeType: ReservationFeeType;
	feeValue: number;
};

export function countNights(
	checkInDate: string,
	checkOutDate: string,
	checkInTime?: string,
	checkOutTime?: string,
): number {
	const checkIn = new Date(`${checkInDate}T${checkInTime ?? "14:00"}`);
	const checkOut = new Date(`${checkOutDate}T${checkOutTime ?? "11:00"}`);
	if (checkIn >= checkOut) return 1;
	const diffMs = checkOut.getTime() - checkIn.getTime();
	return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function calculateStayPricing({
	basePrice,
	checkInDate,
	checkOutDate,
	checkInTime,
	checkOutTime,
}: StayPricingInput): StayPricingResult {
	const nights = countNights(
		checkInDate,
		checkOutDate,
		checkInTime,
		checkOutTime,
	);
	const rate = Number(basePrice) || 0;
	const subtotal = nights * rate;
	return { nights, subtotal };
}

export function calculateReservationFee({
	total,
	feeType,
	feeValue,
}: ReservationFeeInput): number {
	if (feeType === "PERCENT") {
		return (total * feeValue) / 100;
	}
	return feeValue;
}

export function formatPeso(amount: number): string {
	return new Intl.NumberFormat("en-PH", {
		style: "currency",
		currency: "PHP",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function toDecimalString(amount: number): string {
	return amount.toFixed(4);
}
