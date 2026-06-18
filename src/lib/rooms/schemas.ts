import { z } from "zod";
import { roomStatusValues } from "@/db/schema/enums";

export const createRoomSchema = z.object({
	roomNumber: z.string().min(1, "Room number is required"),
	type: z.string().min(1, "Room type is required"),
	capacity: z.number().int().positive("Capacity must be a positive number"),
	basePrice: z.number().positive("Base price must be a positive number"),
	monthlyPrice: z.number().min(0, "Monthly price must be 0 or greater"),
	status: z.enum(roomStatusValues),
});

export const updateRoomSchema = z.object({
	id: z.number(),
	roomNumber: z.string().min(1, "Room number is required").optional(),
	type: z.string().min(1, "Room type is required").optional(),
	capacity: z
		.number()
		.int()
		.positive("Capacity must be a positive number")
		.optional(),
	basePrice: z
		.number()
		.positive("Base price must be a positive number")
		.optional(),
	monthlyPrice: z
		.number()
		.min(0, "Monthly price must be 0 or greater")
		.optional(),
	status: z.enum(roomStatusValues).optional(),
});

export const deleteRoomSchema = z.object({
	id: z.number(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type DeleteRoomInput = z.infer<typeof deleteRoomSchema>;
