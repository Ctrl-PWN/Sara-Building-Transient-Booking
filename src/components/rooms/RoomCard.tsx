import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Room } from "@/lib/rooms/types";

const statusVariants: Record<
	string,
	"success" | "warning" | "destructive" | "default"
> = {
	AVAILABLE: "success",
	MAINTENANCE: "warning",
	OUT_OF_ORDER: "destructive",
	OCCUPIED: "default",
};

type RoomCardProps = {
	room: Room;
	onStatusClick: (room: Room) => void;
};

export function RoomCard({ room, onStatusClick }: RoomCardProps) {
	return (
		<div className="block-card flex flex-col gap-3 p-4.5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-foreground/20">
			<div className="flex items-start justify-between gap-2">
				<span className="font-display text-xl font-semibold text-foreground">
					{room.roomNumber}
				</span>
				<button
					type="button"
					onClick={() => onStatusClick(room)}
					className="cursor-pointer border-0 bg-transparent p-0"
				>
					<Badge
						variant={statusVariants[room.status] ?? "default"}
						className="cursor-pointer"
					>
						{room.status.replace(/_/g, " ")}
					</Badge>
				</button>
			</div>
			<div className="space-y-1.5 text-sm">
				<div className="flex justify-between">
					<span className="text-muted-foreground">Type</span>
					<span className="text-foreground">{room.type}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Capacity</span>
					<span className="text-foreground">{room.capacity} pax</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Daily</span>
					<span className="font-medium text-foreground">
						₱{Number(room.basePrice).toLocaleString()}/night
					</span>
				</div>
				{room.monthlyPrice ? (
					<div className="flex justify-between">
						<span className="text-muted-foreground">Monthly</span>
						<span className="font-medium text-foreground">
							₱{Number(room.monthlyPrice).toLocaleString()}/mo
						</span>
					</div>
				) : null}
			</div>
			<div className="border-t border-border pt-2">
				<Button
					variant="ghost"
					size="xs"
					className="w-full text-muted-foreground"
					onClick={() => onStatusClick(room)}
				>
					Change status
				</Button>
			</div>
		</div>
	);
}
