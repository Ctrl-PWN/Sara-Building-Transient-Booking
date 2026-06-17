import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useAppForm } from "@/integrations/tanstack-form";
import { roomMutations } from "@/lib/rooms/rooms.mutations";
import { createRoomSchema } from "@/lib/rooms/schemas";

type CreateRoomSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateRoomSheet({ open, onOpenChange }: CreateRoomSheetProps) {
	const queryClient = useQueryClient();
	const createRoom = useMutation(roomMutations.create(queryClient));

	const form = useAppForm({
		defaultValues: {
			roomNumber: "",
			type: "",
			capacity: 1,
			basePrice: 0,
		},
		validators: { onSubmit: createRoomSchema },
		onSubmit: async ({ value }) => {
			await createRoom.mutateAsync(value);
			form.reset();
			onOpenChange(false);
		},
	});

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Create room</SheetTitle>
					<SheetDescription>Add a new room to the inventory.</SheetDescription>
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
								<field.TextField
									label="Room number"
									placeholder="101"
									maxLength={3}
								/>
							)}
						</form.AppField>

						<form.AppField name="type">
							{(field) => (
								<field.TextField
									label="Room type"
									placeholder="Standard"
									maxLength={20}
								/>
							)}
						</form.AppField>

						<form.AppField name="capacity">
							{(field) => (
								<field.NumberField
									label="Capacity"
									placeholder="2"
									min={1}
									max={9999}
								/>
							)}
						</form.AppField>

						<form.AppField name="basePrice">
							{(field) => (
								<field.NumberField
									label="Base price"
									placeholder="1200"
									min={1}
									max={9999999}
								/>
							)}
						</form.AppField>

						<div className="flex justify-end gap-2 pt-2">
							<form.SubmitButton label="Create room" />
						</div>
					</form.AppForm>
				</form>
			</SheetContent>
		</Sheet>
	);
}
