import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { roomStatusValues } from "@/db/schema/enums";
import { useAppForm } from "@/integrations/tanstack-form";
import { roomMutations } from "@/lib/rooms/rooms.mutations";
import { updateRoomSchema } from "@/lib/rooms/schemas";
import type { Room } from "@/lib/rooms/types";

type EditRoomSheetProps = {
	room: Room | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditRoomSheet({
	room,
	open,
	onOpenChange,
}: EditRoomSheetProps) {
	const queryClient = useQueryClient();
	const updateRoom = useMutation(roomMutations.update(queryClient));

	const defaultValues: z.infer<typeof updateRoomSchema> = {
		id: room?.id ?? 0,
		roomNumber: room?.roomNumber ?? "",
		type: room?.type ?? "",
		capacity: room?.capacity ?? 0,
		basePrice: Number(room?.basePrice ?? 0),
		status: room?.status ?? ("AVAILABLE" as (typeof roomStatusValues)[number]),
	};

	const form = useAppForm({
		defaultValues,
		validators: { onSubmit: updateRoomSchema },
		onSubmit: async ({ value }) => {
			try {
				await updateRoom.mutateAsync(value);
				toast.success("Room updated successfully");
				onOpenChange(false);
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to update room",
				);
			}
		},
	});

	useEffect(() => {
		if (room && open) {
			form.setFieldValue("id", room.id);
			form.setFieldValue("roomNumber", room.roomNumber);
			form.setFieldValue("type", room.type);
			form.setFieldValue("capacity", room.capacity);
			form.setFieldValue("basePrice", Number(room.basePrice));
			form.setFieldValue("status", room.status);
		}
	}, [room, open, form.setFieldValue]);

	if (!room) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Edit room</SheetTitle>
					<SheetDescription>
						Update details for room {room.roomNumber}.
					</SheetDescription>
				</SheetHeader>

				<form
					className="flex flex-col gap-4 px-4"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<form.AppForm>
						<form.AppField name="roomNumber">
							{(field) => (
								<field.TextField label="Room number" placeholder="101" />
							)}
						</form.AppField>

						<form.AppField name="type">
							{(field) => (
								<field.TextField label="Room type" placeholder="Standard" />
							)}
						</form.AppField>

						<form.AppField name="capacity">
							{(field) => (
								<field.NumberField label="Capacity" placeholder="2" />
							)}
						</form.AppField>

						<form.AppField name="basePrice">
							{(field) => (
								<field.NumberField
									label="Base price"
									placeholder="1200"
									description="Price per night in PHP"
								/>
							)}
						</form.AppField>

						<form.AppField name="status">
							{(field) => (
								<field.SelectField
									label="Status"
									options={roomStatusValues.map((s) => ({
										value: s,
										label: s.replace(/_/g, " "),
									}))}
								/>
							)}
						</form.AppField>

						<div className="flex justify-end gap-2 pt-2">
							<form.SubmitButton label="Save changes" />
						</div>
					</form.AppForm>
				</form>
			</SheetContent>
		</Sheet>
	);
}
