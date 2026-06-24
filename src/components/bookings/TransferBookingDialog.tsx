import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOutsideScroll,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatManilaDateTime } from "@/lib/date/manila";

type TransferBookingDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	booking: BookingWithRoom;
	availableRooms: {
		id: number;
		roomNumber: string;
		type: string;
		basePrice: string | null;
	}[];
	onConfirm: (targetRoomId: number, reason: string) => void;
};

export function TransferBookingDialog({
	open,
	onOpenChange,
	booking,
	availableRooms,
	onConfirm,
}: TransferBookingDialogProps) {
	const [targetRoomId, setTargetRoomId] = useState<string>("");
	const [reason, setReason] = useState("");

	const handleConfirm = () => {
		if (!targetRoomId) return;
		onConfirm(
			Number(targetRoomId),
			reason || "Room transfer due to inconvenience",
		);
		setTargetRoomId("");
		setReason("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogOutsideScroll className="sm:max-w-[425px]">
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Transfer Booking</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<p className="text-sm text-muted-foreground">
							Transfer {booking.bookingRef} ({booking.firstName}{" "}
							{booking.lastName}) from Room {booking.roomNumber} to a different
							room.
						</p>

						<div className="rounded-md bg-muted/50 p-3 text-sm">
							<div className="grid grid-cols-2 gap-2">
								<span className="text-muted-foreground">Current Room:</span>
								<span className="font-medium">
									{booking.roomNumber} ({booking.roomType})
								</span>
								<span className="text-muted-foreground">Check-in:</span>
								<span className="font-medium">
									{formatManilaDateTime(booking.checkIn, "MMMM d, yyyy 'at' HH:mm")}
								</span>
								<span className="text-muted-foreground">Check-out:</span>
								<span className="font-medium">
									{formatManilaDateTime(booking.checkOut, "MMMM d, yyyy 'at' HH:mm")}
								</span>
								<span className="text-muted-foreground">Guests:</span>
								<span className="font-medium">{booking.occupantsCount}</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Target Room</Label>
							<Select
								value={targetRoomId}
								onValueChange={(v) => {
									if (v) setTargetRoomId(v);
								}}
								items={availableRooms.map((r) => ({
									value: String(r.id),
									label: `${r.roomNumber} — ${r.type}`,
								}))}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select a room" />
								</SelectTrigger>
								<SelectContent>
									{availableRooms.map((r) => (
										<SelectItem key={r.id} value={String(r.id)}>
											{r.roomNumber} — {r.type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Transfer Reason</Label>
							<Input
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="Reason for transfer"
							/>
						</div>

						<p className="text-xs text-muted-foreground">
							The original booking will be marked as TRANSFERRED and a new
							booking will be created for the selected room.
						</p>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button onClick={handleConfirm} disabled={!targetRoomId}>
							Confirm Transfer
						</Button>
					</DialogFooter>
				</DialogContent>
			</DialogOutsideScroll>
		</Dialog>
	);
}
