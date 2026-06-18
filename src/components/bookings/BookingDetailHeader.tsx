import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeBookingDisplayStatus } from "@/lib/bookings/status";
import type { BookingWithRoom } from "@/lib/bookings/types";

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

const canCheckIn = (status: string, checkIn: string) => {
	if (status !== "RESERVED") return false;
	const checkInDate = new Date(checkIn);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	checkInDate.setHours(0, 0, 0, 0);
	return today >= checkInDate;
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
			<div className="flex justify-between items-end">
					<div>
						<div className="flex items-center gap-3 mb-2">
							<h2 className="text-3xl font-serif tracking-tight text-foreground">
								{booking.bookingRef}
							</h2>
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
						</div>
						<p className="text-muted-foreground">
							Guest: {booking.firstName} {booking.lastName}
						</p>
						{booking.transferredFromBookingRef && (
							<p className="text-sm text-muted-foreground mt-1">
								Transferred from: <span className="font-medium text-foreground">{booking.transferredFromBookingRef}</span>
							</p>
						)}
				</div>
				<div className="flex gap-2">
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
			</div>
		</div>
	);
}
