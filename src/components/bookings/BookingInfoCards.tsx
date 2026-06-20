import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookingWithRoom } from "@/lib/bookings/types";

type BookingInfoCardsProps = {
	booking: BookingWithRoom;
};

export function BookingInfoCards({ booking }: BookingInfoCardsProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			<Card className="md:col-span-2">
				<CardHeader>
					<CardTitle>Stay Details</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-2 gap-y-6">
					<div>
						<p className="text-sm text-muted-foreground">Booking Type</p>
						<p className="font-medium mt-1">
							{booking.bookingType === "MONTHLY" ? "Monthly" : "Daily"}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Check-in</p>
						<p className="font-medium mt-1">
							{format(new Date(booking.checkIn), "MMMM d, yyyy 'at' HH:mm")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Check-out</p>
						<p className="font-medium mt-1">
							{format(new Date(booking.checkOut), "MMMM d, yyyy 'at' HH:mm")}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Room</p>
						<p className="font-medium mt-1">
							{booking.roomNumber} ({booking.roomType})
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Occupants</p>
						<p className="font-medium mt-1">{booking.occupantsCount} Pax</p>
					</div>
					{booking.cancellationReason && (
						<div>
							<p className="text-sm text-muted-foreground">
								{booking.status === "EVICTED"
									? "Eviction Reason"
									: booking.status === "TRANSFERRED"
										? "Transfer Reason"
										: "Cancellation Reason"}
							</p>
							<p className="font-medium mt-1">{booking.cancellationReason}</p>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Guest Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<p className="text-sm text-muted-foreground">Name</p>
						<p className="font-medium mt-1">
							{booking.firstName} {booking.lastName}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Contact</p>
						<p className="font-medium mt-1">{booking.contactNumber || "N/A"}</p>
					</div>

					<div>
						<p className="text-sm text-muted-foreground">Address</p>
						<p className="font-medium mt-1">{booking.address}</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
