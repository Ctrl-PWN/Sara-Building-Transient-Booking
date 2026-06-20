import { pgEnum } from "drizzle-orm/pg-core";

export const bookingStatusEnum = pgEnum("booking_status", [
	"RESERVED",
	"CHECKED_IN",
	"CHECKED_OUT",
	"CANCELLED",
	"EVICTED",
	"TRANSFERRED",
]);

export const bookingPaymentStatusEnum = pgEnum("booking_payment_status", [
	"CURRENT",
	"OVERDUE",
	"PAID_IN_FULL",
]);

export const roomStatusEnum = pgEnum("room_status", [
	"AVAILABLE",
	"MAINTENANCE",
	"OUT_OF_ORDER",
	"OCCUPIED",
]);

export const ledgerTransactionCategoryEnum = pgEnum(
	"ledger_transaction_category",
	["ROOM_CHARGE", "DEPOSIT", "PAYMENT", "REFUND", "LATE_FEE"],
);

export const paymentMethodEnum = pgEnum("payment_method", [
	"CASH",
	"GCASH",
	"BANK_TRANSFER",
]);

export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);

export const bookingTypeEnum = pgEnum("booking_type", ["DAILY", "MONTHLY"]);

export const utilityTypeEnum = pgEnum("utility_type", [
	"ELECTRICITY",
	"WATER",
	"INTERNET",
	"OTHER",
]);

export const bookingStatusValues = bookingStatusEnum.enumValues;
export const bookingPaymentStatusValues = bookingPaymentStatusEnum.enumValues;
export const roomStatusValues = roomStatusEnum.enumValues;
export const ledgerTransactionCategoryValues =
	ledgerTransactionCategoryEnum.enumValues;
export const paymentMethodValues = paymentMethodEnum.enumValues;
export const userRoleValues = userRoleEnum.enumValues;
export const bookingTypeValues = bookingTypeEnum.enumValues;
export const utilityTypeValues = utilityTypeEnum.enumValues;

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type BookingPaymentStatus =
	(typeof bookingPaymentStatusEnum.enumValues)[number];
export type RoomStatus = (typeof roomStatusEnum.enumValues)[number];
export type LedgerTransactionCategory =
	(typeof ledgerTransactionCategoryEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type BookingType = (typeof bookingTypeEnum.enumValues)[number];
export type UtilityType = (typeof utilityTypeEnum.enumValues)[number];
