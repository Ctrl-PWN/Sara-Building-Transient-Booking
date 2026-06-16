import { Link } from "@tanstack/react-router";

import { TimelineBookingBar } from "@/components/timeline/TimelineBookingBar";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { getBarPosition } from "@/lib/timeline/positioning";
import { isToday } from "@/lib/timeline/week";
import { cn } from "@/lib/utils";

type TimelineRoomRowProps = {
	roomId: number;
	roomNumber: string;
	roomType: string;
	days: string[];
	bookings: BookingWithRoom[];
	weekStart: string;
	weekEnd: string;
	selectedBookingId: number | null;
	onSelectBooking: (bookingId: number) => void;
};

export function TimelineRoomRow({
	roomId,
	roomNumber,
	roomType,
	days,
	bookings,
	weekStart,
	weekEnd,
	selectedBookingId,
	onSelectBooking,
}: TimelineRoomRowProps) {
	return (
		<div className="grid grid-cols-[11rem_repeat(7,minmax(5rem,1fr))] border-b border-border last:border-b-0">
			<Link
				to="/rooms/$roomId"
				params={{ roomId: String(roomId) }}
				className="sticky left-0 z-1 flex flex-col justify-center self-stretch border-r border-border bg-surface-dim px-4 py-4 no-underline shadow-[4px_0_8px_-2px_rgba(0,0,0,0.2)] transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<p className="font-body text-base font-semibold text-foreground m-0">
					{roomNumber}
				</p>
				<p className="font-body text-[0.7rem] font-bold uppercase tracking-[0.12em] text-muted-foreground m-0">
					{roomType}
				</p>
			</Link>

			<div className="relative col-span-7 min-h-16">
				<div className="grid h-full grid-cols-7">
					{days.map((day) => (
						<div
							key={day}
							className={cn(
								"border-r border-border/70 bg-surface last:border-r-0",
								isToday(day) && "bg-(--surface-container-high)/50",
							)}
						/>
					))}
				</div>

				<div className="absolute inset-0">
					{bookings.map((booking) => {
						const position = getBarPosition(
							booking.checkIn,
							booking.checkOut,
							weekStart,
							weekEnd,
						);

						if (!position) return null;

						return (
							<TimelineBookingBar
								key={booking.id}
								booking={booking}
								position={position}
								isSelected={selectedBookingId === booking.id}
								onSelect={onSelectBooking}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}
