import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, isNull, not, sql } from "drizzle-orm";
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
	.validator(
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
	.validator(createRoomSchema)
	.handler(async ({ data }) => {
		const [room] = await db
			.insert(rooms)
			.values({
				roomNumber: data.roomNumber,
				type: data.type,
				capacity: data.capacity,
				basePrice: data.basePrice.toString(),
				monthlyPrice:
					data.monthlyPrice > 0 ? data.monthlyPrice.toString() : null,
				status: data.status,
			})
			.returning();
		return room;
	});

export const updateRoom = createServerFn({ method: "POST" })
	.middleware([authMiddleware()])
	.validator(updateRoomSchema)
	.handler(async ({ data }) => {
		const updateData: Record<string, unknown> = {};
		if (data.roomNumber !== undefined) updateData.roomNumber = data.roomNumber;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.capacity !== undefined) updateData.capacity = data.capacity;
		if (data.basePrice !== undefined)
			updateData.basePrice = data.basePrice.toString();
		if (data.monthlyPrice !== undefined)
			updateData.monthlyPrice =
				data.monthlyPrice != null ? data.monthlyPrice.toString() : null;
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
	.validator(deleteRoomSchema)
	.handler(async ({ data }) => {
		await db
			.update(rooms)
			.set({ deletedAt: new Date() })
			.where(eq(rooms.id, data.id));
	});

export const syncRoomStatuses = createServerFn({ method: "POST" })
	.middleware([authMiddleware()])
	.handler(async () => {
		// Get all rooms with active bookings (RESERVED or CHECKED_IN)
		const roomsWithActiveBookings = await db
			.select({
				roomId: bookings.roomId,
				hasCheckedIn: sql<boolean>`bool_or(${bookings.status} = 'CHECKED_IN')`.as("has_checked_in"),
			})
			.from(bookings)
			.where(
				and(
					isNull(bookings.deletedAt),
					inArray(bookings.status, ["RESERVED", "CHECKED_IN"]),
				),
			)
			.groupBy(bookings.roomId);

		// Update each room based on its active bookings
		for (const { roomId, hasCheckedIn } of roomsWithActiveBookings) {
			await db
				.update(rooms)
				.set({ status: hasCheckedIn ? "OCCUPIED" : "AVAILABLE" })
				.where(eq(rooms.id, roomId));
		}

		// Set all other rooms (no active bookings) to AVAILABLE
		const occupiedRoomIds = roomsWithActiveBookings.map((r) => r.roomId);
		if (occupiedRoomIds.length > 0) {
			await db
				.update(rooms)
				.set({ status: "AVAILABLE" })
				.where(
					and(
						isNull(rooms.deletedAt),
						not(inArray(rooms.id, occupiedRoomIds)),
					),
				);
		} else {
			await db
				.update(rooms)
				.set({ status: "AVAILABLE" })
				.where(isNull(rooms.deletedAt));
		}

		return { success: true };
	});
