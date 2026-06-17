import { Link } from "@tanstack/react-router";
import { formatGuestName } from "@/lib/bookings/types";
import type { DashboardBookingRow } from "@/lib/dashboard/dashboard.types";
import { formatManilaDate } from "@/lib/date/manila";

type TodayListCardProps = {
	title: string;
	bookings: DashboardBookingRow[];
	emptyMessage: string;
};

export function TodayListCard({
	title,
	bookings,
	emptyMessage,
}: TodayListCardProps) {
	return (
		<article className="block-card flex flex-col">
			<header className="border-b border-outline px-6 py-5">
				<p className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
					{title} ({bookings.length})
				</p>
			</header>
			<div className="flex-1 p-2">
				{bookings.length === 0 ? (
					<p className="py-10 text-center font-body text-sm text-on-surface-variant">
						{emptyMessage}
					</p>
				) : (
					<ul className="flex flex-col">
						{bookings.map((booking) => (
							<Link
								key={booking.id}
								to="/bookings/$bookingId"
								params={{ bookingId: String(booking.id) }}
								className="group flex items-center justify-between rounded-lg px-4 py-4 transition-colors hover:bg-surface-container-high"
							>
								<div>
									<p className="font-body text-sm font-semibold text-on-surface">
										{formatGuestName(booking)}
									</p>
									<p className="mt-0.5 font-body text-xs text-on-surface-variant">
										{booking.roomNumber} · {booking.roomType} ·{" "}
										{booking.occupantsCount} guest
										{booking.occupantsCount === 1 ? "" : "s"}
									</p>
								</div>
								<span className="font-body text-xs font-medium text-on-surface-variant group-hover:text-on-surface">
									{formatManilaDate(booking.checkIn)} →{" "}
									{formatManilaDate(booking.checkOut)}
								</span>
							</Link>
						))}
					</ul>
				)}
			</div>
		</article>
	);
}
