import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeBookingDisplayStatus } from "@/lib/bookings/status";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { isSameManilaDayOrAfter } from "@/lib/date/manila";

const statusColorMap: Record<
	string,
	"default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
	RESERVED: "warning",
	CHECKED_IN: "success",
	CHECKED_OUT: "outline",
	CANCELLED: "destructive",
	EVICTED: "destructive",
	OVERDUE: "destructive",
	TRANSFERRED: "secondary",
};

const isNonRefundable = (depositPctSnapshot: string) =>
	Number(depositPctSnapshot) >= 100;

const canCancel = (status: string) => ["RESERVED"].includes(status);

const canCheckIn = (status: string, checkIn: string | null) => {
	if (status !== "RESERVED") return false;
	if (!checkIn) return false;
	return isSameManilaDayOrAfter(checkIn);
};

const canCheckOut = (status: string) => ["CHECKED_IN"].includes(status);

const canEvict = (status: string, paymentStatus: string) =>
	status === "CHECKED_IN" && paymentStatus === "PAID_IN_FULL";

const canTransfer = (status: string) => status === "CHECKED_IN";

const canExtend = (bookingType: string, status: string) => {
	return bookingType === "MONTHLY" && status === "CHECKED_IN";
};

type BookingDetailHeaderProps = {
	booking: BookingWithRoom;
	onCancelClick: () => void;
	onEvictClick: () => void;
	onCheckIn: () => void;
	onCheckOut: () => void;
	onTransferClick: () => void;
	onExtendClick: () => void;
};

export function BookingDetailHeader({
	booking,
	onCancelClick,
	onEvictClick,
	onCheckIn,
	onCheckOut,
	onTransferClick,
	onExtendClick,
}: BookingDetailHeaderProps) {
	const displayStatus = computeBookingDisplayStatus(
		booking.status,
		booking.checkOut,
	);

	return (
		<div>
			<Link
				to="/bookings"
				className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
			>
				<ArrowLeftIcon className="mr-2" size={16} />
				Back to Bookings
			</Link>
			<PageHeader
				title={booking.bookingRef}
				description={
					booking.transferredFromBookingRef
						? `Transferred from ${booking.transferredFromBookingRef}`
						: undefined
				}
				actions={
					<div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
						<Badge variant={statusColorMap[displayStatus]}>
							{displayStatus.replace("_", " ")}
						</Badge>
						<Badge variant="secondary" className="text-[10px] uppercase">
							{booking.bookingType === "MONTHLY" ? "Monthly" : "Daily"}
						</Badge>
						{booking.paymentStatus === "OVERDUE" && (
							<Badge variant="destructive">OVERDUE</Badge>
						)}
						{isNonRefundable(booking.depositPctSnapshot) && (
							<Badge variant="destructive">NON-REFUNDABLE</Badge>
						)}
						{canCancel(booking.status) && (
							<Button variant="outline" onClick={onCancelClick}>
								Cancel
							</Button>
						)}
						{canCheckIn(booking.status, booking.checkIn) && (
							<Button onClick={onCheckIn}>Check In</Button>
						)}
						{canCheckOut(booking.status) && (
							<Button onClick={onCheckOut}>Check Out</Button>
						)}
						{canEvict(booking.status, booking.paymentStatus) && (
							<Button variant="destructive" onClick={onEvictClick}>
								Evict
							</Button>
						)}
						{canTransfer(booking.status) && (
							<Button variant="outline" onClick={onTransferClick}>
								Transfer
							</Button>
						)}
						{canExtend(booking.bookingType, booking.status) && (
							<Button variant="outline" onClick={onExtendClick}>
								Extend
							</Button>
						)}
					</div>
				}
			/>
		</div>
	);
}
