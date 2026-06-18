import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { roomMutations } from "@/lib/rooms/rooms.mutations";
import type { Room } from "@/lib/rooms/types";

type DeleteRoomDialogProps = {
	room: Room | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteRoomDialog({
	room,
	open,
	onOpenChange,
}: DeleteRoomDialogProps) {
	const queryClient = useQueryClient();
	const deleteRoom = useMutation(roomMutations.delete(queryClient));

	async function handleDelete() {
		if (!room) return;
		await deleteRoom.mutateAsync({ id: room.id });
		onOpenChange(false);
	}

	if (!room) return null;

	const isOccupied = room.status === "OCCUPIED";

	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xs data-ending-style:opacity-0 data-starting-style:opacity-0" />
				<DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover p-6 shadow-lg ring-1 ring-foreground/10 data-ending-style:opacity-0 data-starting-style:opacity-0">
					<DialogPrimitive.Title className="text-base font-medium text-foreground">
						Delete room
					</DialogPrimitive.Title>
					<DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
						{isOccupied ? (
							<span>
								Room{" "}
								<span className="font-medium text-foreground">
									{room.roomNumber}
								</span>{" "}
								is currently occupied and cannot be deleted.
							</span>
						) : (
							<span>
								Are you sure you want to delete room{" "}
								<span className="font-medium text-foreground">
									{room.roomNumber}
								</span>
								? This action cannot be undone.
							</span>
						)}
					</DialogPrimitive.Description>
					<div className="mt-6 flex justify-end gap-2">
						<DialogPrimitive.Close render={<Button variant="outline" />}>
							Cancel
						</DialogPrimitive.Close>
						<Button
							variant="destructive"
							onClick={() => {
								void handleDelete();
							}}
							disabled={deleteRoom.isPending || isOccupied}
						>
							{deleteRoom.isPending ? "Deleting..." : "Delete"}
						</Button>
					</div>
				</DialogPrimitive.Popup>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
