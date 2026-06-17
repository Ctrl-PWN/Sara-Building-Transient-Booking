import type { RoomStatus } from "@/db/schema/enums";

const validTransitions: Record<RoomStatus, readonly RoomStatus[]> = {
	AVAILABLE: ["MAINTENANCE", "OUT_OF_ORDER"],
	MAINTENANCE: ["AVAILABLE", "OUT_OF_ORDER"],
	OUT_OF_ORDER: ["AVAILABLE", "MAINTENANCE"],
	OCCUPIED: [],
};

export function getValidRoomStatusTransitions(
	currentStatus: RoomStatus,
): readonly RoomStatus[] {
	return validTransitions[currentStatus] ?? [];
}

export function canTransitionTo(
	currentStatus: RoomStatus,
	targetStatus: RoomStatus,
): boolean {
	if (currentStatus === targetStatus) return false;
	return getValidRoomStatusTransitions(currentStatus).includes(targetStatus);
}
