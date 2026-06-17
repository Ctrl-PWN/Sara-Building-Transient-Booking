import { z } from "zod";
import { roomStatusValues } from "@/db/schema/enums";

export const createRoomSchema = z.object({
	roomNumber: z
		.string()
		.min(1, "Room number is required")
		.max(3, "Room number is too long"),
	type: z
		.string()
		.min(1, "Room type is required")
		.max(20, "Room type is too long"),
	capacity: z
		.number()
		.int()
		.positive("Capacity must be a positive number")
		.max(9999, "Capacity is too large"),
	basePrice: z
		.number()
		.positive("Base price must be a positive number")
		.max(9999999, "Base price is too large"),
});

export const updateRoomSchema = z.object({
	id: z.number(),
	roomNumber: z
		.string()
		.min(1, "Room number is required")
		.max(3, "Room number is too long")
		.optional(),
	type: z
		.string()
		.min(1, "Room type is required")
		.max(20, "Room type is too long")
		.optional(),
	capacity: z
		.number()
		.int()
		.positive("Capacity must be a positive number")
		.max(9999, "Capacity is too large")
		.optional(),
	basePrice: z
		.number()
		.positive("Base price must be a positive number")
		.max(9999999, "Base price is too large")
		.optional(),
	status: z.enum(roomStatusValues).optional(),
});

export const deleteRoomSchema = z.object({
	id: z.number(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type DeleteRoomInput = z.infer<typeof deleteRoomSchema>;
