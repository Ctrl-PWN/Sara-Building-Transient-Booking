import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { RoomStatus } from "@/db/schema/enums";
import { roomMutations } from "@/lib/rooms/rooms.mutations";
import { getValidRoomStatusTransitions } from "@/lib/rooms/status";
import type { Room } from "@/lib/rooms/types";

type ChangeRoomStatusDialogProps = {
	room: Room;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ChangeRoomStatusDialog({
	room,
	open,
	onOpenChange,
}: ChangeRoomStatusDialogProps) {
	const queryClient = useQueryClient();
	const updateRoom = useMutation(roomMutations.update(queryClient));
	const validStatuses = getValidRoomStatusTransitions(room.status);
	const [selectedStatus, setSelectedStatus] = useState<string>(
		validStatuses[0] ?? room.status,
	);

	useEffect(() => {
		if (open) {
			const next = validStatuses[0] ?? room.status;
			setSelectedStatus(next);
		}
	}, [open, room.status, validStatuses]);

	const handleConfirm = async () => {
		try {
			await updateRoom.mutateAsync({
				id: room.id,
				status: selectedStatus as RoomStatus,
			});
			toast.success(`Status updated to ${selectedStatus.replace(/_/g, " ")}`);
			onOpenChange(false);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update room status",
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change room status</DialogTitle>
					<DialogDescription>
						Update status for Room {room.roomNumber}. Current:{" "}
						{room.status.replace(/_/g, " ")}
					</DialogDescription>
				</DialogHeader>

				{validStatuses.length === 0 ? (
					<p className="py-4 text-sm text-muted-foreground">
						{room.status === "OCCUPIED"
							? "An occupied room cannot change status."
							: "No valid status changes available for this room."}
					</p>
				) : (
					<div className="py-4">
						<Select
							value={selectedStatus}
							onValueChange={(next) =>
								setSelectedStatus(next ?? selectedStatus)
							}
							items={validStatuses.map((s) => ({
								value: s,
								label: s.replace(/_/g, " "),
							}))}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent side="bottom" collisionPadding={100}>
								{validStatuses.map((s) => (
									<SelectItem key={s} value={s}>
										{s.replace(/_/g, " ")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<DialogFooter>
					<DialogClose render={<Button variant="outline">Cancel</Button>} />
					<Button
						onClick={handleConfirm}
						disabled={updateRoom.isPending || validStatuses.length === 0}
					>
						{updateRoom.isPending ? (
							<ArrowsClockwiseIcon className="size-4 animate-spin" />
						) : null}
						{updateRoom.isPending ? "Updating..." : "Update status"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
