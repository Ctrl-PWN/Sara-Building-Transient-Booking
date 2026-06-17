import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, isNull } from "drizzle-orm";
import z from "zod";
import { db } from "@/db/index";
import { bookings, rooms } from "@/db/schema";
import { authMiddleware } from "@/lib/require-admin";
import {
	createRoomSchema,
	deleteRoomSchema,
	updateRoomSchema,
} from "./schemas";

export const getRooms = createServerFn({ method: "GET" }).handler(async () => {
	return await db.query.rooms.findMany({
		where: isNull(rooms.deletedAt),
		orderBy: [rooms.roomNumber],
	});
});

export const getRoomById = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			id: z.number(),
		}),
	)
	.handler(async ({ data }) => {
		const room = await db.query.rooms.findFirst({
			where: eq(rooms.id, data.id),
		});
		if (!room) {
			throw new Error("Room not found");
		}
		return room;
	});

export const createRoom = createServerFn({ method: "POST" })
	.middleware([authMiddleware()])
	.inputValidator(createRoomSchema)
	.handler(async ({ data }) => {
		const [room] = await db
			.insert(rooms)
			.values({
				roomNumber: data.roomNumber,
				type: data.type,
				capacity: data.capacity,
				basePrice: data.basePrice.toString(),
			})
			.returning();
		return room;
	});

export const updateRoom = createServerFn({ method: "POST" })
	.middleware([authMiddleware()])
	.inputValidator(updateRoomSchema)
	.handler(async ({ data }) => {
		const current = await db.query.rooms.findFirst({
			where: eq(rooms.id, data.id),
		});
		if (!current) {
			throw new Error("Room not found");
		}
		if (current.status === "OCCUPIED") {
			throw new Error("Cannot update an occupied room");
		}

		const updateData: Record<string, unknown> = {};
		if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.capacity !== undefined) updateData.capacity = data.capacity;
		if (data.basePrice !== undefined)
			updateData.basePrice = data.basePrice.toString();
		if (data.status !== undefined) updateData.status = data.status;

		const [room] = await db
			.update(rooms)
			.set(updateData)
			.where(eq(rooms.id, data.id))
			.returning();
		return room;
	});

export const deleteRoom = createServerFn({ method: "POST" })
	.middleware([authMiddleware()])
	.inputValidator(deleteRoomSchema)
	.handler(async ({ data }) => {
		const current = await db.query.rooms.findFirst({
			where: eq(rooms.id, data.id),
		});
		if (!current) {
			throw new Error("Room not found");
		}
		if (current.status === "OCCUPIED") {
			throw new Error("Cannot delete an occupied room");
		}

		const [result] = await db
			.select({ bookingCount: count() })
			.from(bookings)
			.where(and(eq(bookings.roomId, data.id), isNull(bookings.deletedAt)));
		if (result.bookingCount > 0) {
			throw new Error(
				"Cannot delete a room with existing booking records. Consider disabling the room instead.",
			);
		}

		await db
			.update(rooms)
			.set({ deletedAt: new Date().toISOString() })
			.where(eq(rooms.id, data.id));
	});
