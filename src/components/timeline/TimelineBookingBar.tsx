import { format, parseISO } from "date-fns";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getBookingStatusPresentation } from "@/lib/bookings/status";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatGuestName } from "@/lib/bookings/types";
import type { TimelineBarPosition } from "@/lib/timeline/types";
import { cn } from "@/lib/utils";

type TimelineBookingBarProps = {
	booking: BookingWithRoom;
	position: TimelineBarPosition;
	isSelected: boolean;
	onSelect: (bookingId: number) => void;
};

export function TimelineBookingBar({
	booking,
	position,
	isSelected,
	onSelect,
}: TimelineBookingBarProps) {
	const guestName = formatGuestName(booking);
	const presentation = getBookingStatusPresentation(booking.status);
	const tooltipLabel = `${guestName} · ${format(parseISO(booking.checkIn), "d MMM")} – ${format(parseISO(booking.checkOut), "d MMM")}`;
	const isHatched = booking.status === "RESERVED";

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<button
						type="button"
						aria-pressed={isSelected}
						aria-label={`${guestName}, ${presentation.label}`}
						onClick={() => onSelect(booking.id)}
						className={cn(
							"absolute inset-y-2 flex min-w-8 items-center rounded-md border px-3 text-left text-xs font-medium tracking-tight shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
							isSelected && "ring-2 ring-ring shadow-md",
						)}
						style={{
							left: `${position.leftPct}%`,
							width: `${position.widthPct}%`,
							background: isHatched
								? `repeating-linear-gradient(135deg, color-mix(in srgb, var(${presentation.colorVar}) 18%, transparent) 0 8px, transparent 8px 16px), color-mix(in srgb, var(${presentation.colorVar}) 22%, var(--surface-bright))`
								: `color-mix(in srgb, var(${presentation.colorVar}) 24%, var(--surface-bright))`,
							borderColor: `color-mix(in srgb, var(${presentation.colorVar}) 70%, var(--outline))`,
							color: "var(--on-surface)",
						}}
					/>
				}
			>
				<span className="truncate">{guestName}</span>
			</TooltipTrigger>
			<TooltipContent>{tooltipLabel}</TooltipContent>
		</Tooltip>
	);
}
