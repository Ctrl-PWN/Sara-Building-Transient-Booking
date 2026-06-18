export type ReservationFeeType = "PERCENT" | "FIXED";

export type StayPricingInput = {
	basePrice: number | string;
	checkIn: string;
	checkOut: string;
};

export type StayPricingResult = {
	nights: number;
	subtotal: number;
};

export type MonthlyPricingInput = {
	monthlyPrice: number | string;
	durationMonths: number;
};

export type MonthlyPricingResult = {
	subtotal: number;
	deposit: number;
	balance: number;
};

export type ReservationFeeInput = {
	total: number;
	feeType: ReservationFeeType;
	feeValue: number;
};

export function countNights(checkIn: string, checkOut: string): number {
	const checkInDate = new Date(checkIn);
	const checkOutDate = new Date(checkOut);
	if (checkInDate >= checkOutDate) return 1;
	const diffMs = checkOutDate.getTime() - checkInDate.getTime();
	return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function calculateStayPricing({
	basePrice,
	checkIn,
	checkOut,
}: StayPricingInput): StayPricingResult {
	const nights = countNights(checkIn, checkOut);
	const rate = Number(basePrice) || 0;
	const subtotal = nights * rate;
	return { nights, subtotal };
}

export function calculateMonthlyPricing({
	monthlyPrice,
	durationMonths,
}: MonthlyPricingInput): MonthlyPricingResult {
	const rate = Number(monthlyPrice) || 0;
	const subtotal = rate * durationMonths;
	const deposit = rate;
	const balance = subtotal - deposit;
	return { subtotal, deposit, balance };
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
