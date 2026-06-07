import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import {
	getBookingStatusPresentation,
	timelineLegendStatuses,
} from "@/lib/bookings/status";

export function TimelineStatusLegend() {
	return (
		<section
			aria-label="Booking status legend"
			className="flex flex-wrap items-center gap-2 md:flex-nowrap"
		>
			{timelineLegendStatuses.map((status) => (
				<BookingStatusBadge
					key={status}
					status={status}
					presentation={getBookingStatusPresentation(status)}
				/>
			))}
		</section>
	);
}
