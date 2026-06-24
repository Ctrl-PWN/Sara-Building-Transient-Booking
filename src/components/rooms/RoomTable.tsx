import { DoorIcon, PencilIcon, TrashIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { Room } from "@/lib/rooms/types";

type RoomTableProps = {
	rooms: Room[];
	onEdit: (room: Room) => void;
	onDelete: (room: Room) => void;
};

const statusVariants: Record<
	string,
	"success" | "warning" | "destructive" | "default"
> = {
	AVAILABLE: "success",
	MAINTENANCE: "warning",
	OUT_OF_ORDER: "destructive",
	OCCUPIED: "default",
};

export function RoomTable({ rooms, onEdit, onDelete }: RoomTableProps) {
	if (rooms.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<DoorIcon />
					</EmptyMedia>
					<EmptyTitle>No rooms found</EmptyTitle>
					<EmptyDescription>
						No rooms match your current filters.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent />
			</Empty>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full font-body text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/30 text-left">
						<th className="px-4 py-3 font-medium text-muted-foreground">
							Room
						</th>
						<th className="px-4 py-3 font-medium text-muted-foreground">
							Type
						</th>
						<th className="px-4 py-3 font-medium text-muted-foreground">
							Capacity
						</th>
						<th className="px-4 py-3 font-medium text-muted-foreground">
							Base price
						</th>
						<th className="px-4 py-3 font-medium text-muted-foreground">
							Monthly price
						</th>
						<th className="px-4 py-3 font-medium text-muted-foreground">
							Status
						</th>
						<th className="px-4 py-3 font-medium text-muted-foreground">
							<span className="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{rooms.map((room) => (
						<tr
							key={room.id}
							className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
						>
							<td className="px-4 py-3 font-medium text-foreground">
								{room.roomNumber}
							</td>
							<td className="px-4 py-3 text-muted-foreground">{room.type}</td>
							<td className="px-4 py-3 text-muted-foreground">
								{room.capacity}
							</td>
							<td className="px-4 py-3 text-muted-foreground">
								{formatPeso(Number(room.basePrice))}
							</td>
							<td className="px-4 py-3">
								{room.monthlyPrice
									? formatPeso(Number(room.monthlyPrice))
									: "N/A"}
							</td>
							<td className="px-4 py-3">
								<Badge variant={statusVariants[room.status] ?? "default"}>
									{room.status.replace(/_/g, " ")}
								</Badge>
							</td>
							<td className="px-4 py-3">
								<div className="flex items-center justify-end gap-1">
									<Button
										variant="ghost"
										onClick={() => onEdit(room)}
										aria-label={`Edit room ${room.roomNumber}`}
									>
										<PencilIcon />
									</Button>
									<Button
										variant="ghost"
										onClick={() => onDelete(room)}
										aria-label={`Delete room ${room.roomNumber}`}
									>
										<TrashIcon />
									</Button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
