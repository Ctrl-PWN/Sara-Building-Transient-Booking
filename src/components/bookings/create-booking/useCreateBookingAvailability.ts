import type { rooms } from "@/db/schema";
import type { BookingWithRoom } from "@/lib/bookings/types";

export function getEarliestCheckInTime(
	bookings: BookingWithRoom[],
	roomId: number,
	dateString: string,
): string {
	const targetDate = `${dateString}T00:00:00`;
	let latestCheckout = "00:00";

	for (const booking of bookings) {
		if (
			booking.roomId !== roomId ||
			(booking.status !== "RESERVED" && booking.status !== "CHECKED_IN")
		) {
			continue;
		}

		const checkInDate = new Date(booking.checkIn);
		const checkOutDate = new Date(booking.checkOut);
		const target = new Date(targetDate);

		const checkInDay = new Date(checkInDate);
		checkInDay.setHours(0, 0, 0, 0);
		const checkOutDay = new Date(checkOutDate);
		checkOutDay.setHours(0, 0, 0, 0);
		const targetDay = new Date(target);
		targetDay.setHours(0, 0, 0, 0);

		if (
			checkInDay.getTime() <= targetDay.getTime() &&
			checkOutDay.getTime() >= targetDay.getTime()
		) {
			const checkOutTime = `${String(checkOutDate.getHours()).padStart(2, "0")}:${String(checkOutDate.getMinutes()).padStart(2, "0")}`;
			if (checkOutTime > latestCheckout) {
				latestCheckout = checkOutTime;
			}
		}
	}

	return latestCheckout;
}

export function getLatestCheckOutTime(
	bookings: BookingWithRoom[],
	roomId: number,
	dateString: string,
): string {
	const targetDate = `${dateString}T00:00:00`;
	let earliestCheckin = "23:59";

	for (const booking of bookings) {
		if (
			booking.roomId !== roomId ||
			(booking.status !== "RESERVED" && booking.status !== "CHECKED_IN")
		) {
			continue;
		}

		const checkInDate = new Date(booking.checkIn);
		const checkOutDate = new Date(booking.checkOut);
		const target = new Date(targetDate);

		const checkInDay = new Date(checkInDate);
		checkInDay.setHours(0, 0, 0, 0);
		const checkOutDay = new Date(checkOutDate);
		checkOutDay.setHours(0, 0, 0, 0);
		const targetDay = new Date(target);
		targetDay.setHours(0, 0, 0, 0);

		if (
			checkInDay.getTime() <= targetDay.getTime() &&
			checkOutDay.getTime() >= targetDay.getTime()
		) {
			const checkInTime = `${String(checkInDate.getHours()).padStart(2, "0")}:${String(checkInDate.getMinutes()).padStart(2, "0")}`;
			if (checkInTime < earliestCheckin) {
				earliestCheckin = checkInTime;
			}
		}
	}

	return earliestCheckin;
}

type Room = typeof rooms.$inferSelect;

type RoomOption = {
	value: string;
	label: string;
	disabled: boolean;
};

function buildBookedDaysByRoom(bookings: BookingWithRoom[]) {
	const bookedDaysByRoom = new Map<number, Set<number>>();
	for (const booking of bookings) {
		if (booking.status !== "RESERVED" && booking.status !== "CHECKED_IN") {
			continue;
		}
		const bStart = new Date(booking.checkIn);
		bStart.setHours(0, 0, 0, 0);
		const bEnd = new Date(booking.checkOut);
		bEnd.setHours(0, 0, 0, 0);
		let set = bookedDaysByRoom.get(booking.roomId);
		if (!set) {
			set = new Set<number>();
			bookedDaysByRoom.set(booking.roomId, set);
		}
		if (bStart.getTime() === bEnd.getTime()) {
			set.add(bStart.getTime());
		} else {
			for (let t = bStart.getTime(); t < bEnd.getTime(); t += 86_400_000) {
				set.add(t);
			}
		}
	}
	return bookedDaysByRoom;
}

export function useCreateBookingAvailability({
	rooms,
	bookings,
	walkIn,
	bookingType,
}: {
	rooms: Room[];
	bookings: BookingWithRoom[];
	walkIn: boolean;
	bookingType: "DAILY" | "MONTHLY";
}) {
	const bookedDaysByRoom = buildBookedDaysByRoom(bookings);

	const activeBookingRoomIds = new Set<number>();
	for (const booking of bookings) {
		if (booking.status === "RESERVED" || booking.status === "CHECKED_IN") {
			activeBookingRoomIds.add(booking.roomId);
		}
	}

	const allRooms = rooms.slice().sort((a, b) => {
		const aBlocked = a.status !== "AVAILABLE";
		const bBlocked = b.status !== "AVAILABLE";
		if (!aBlocked && bBlocked) return -1;
		if (aBlocked && !bBlocked) return 1;
		return a.roomNumber.localeCompare(b.roomNumber);
	});

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const todayKey = todayStart.getTime();

	function formatShortDateTime(iso: string): string {
		const d = new Date(iso);
		const month = d.toLocaleDateString("en-US", { month: "short" });
		const day = d.getDate();
		let h = d.getHours();
		const m = String(d.getMinutes()).padStart(2, "0");
		const period = h >= 12 ? "PM" : "AM";
		h = h % 12 || 12;
		return `${month} ${day}, ${h}:${m} ${period}`;
	}

	const now = new Date();

	const roomOptions: RoomOption[] = allRooms.map((room) => {
		const roomBookings = bookings.filter(
			(b) =>
				room.id === b.roomId &&
				(b.status === "RESERVED" || b.status === "CHECKED_IN"),
		);
		const hasActiveBooking = activeBookingRoomIds.has(room.id);

		const isWalkInBlocked = roomBookings.some((b) => {
			// CHECKED_IN rooms are always occupied
			if (b.status === "CHECKED_IN") return true;
			const bCheckIn = new Date(b.checkIn);
			const bCheckOut = new Date(b.checkOut);
			const todayEnd = new Date(todayKey + 86_400_000);
			return bCheckIn < todayEnd && bCheckOut > todayStart;
		});

		const isBookedToday = bookedDaysByRoom.get(room.id)?.has(todayKey) ?? false;
		const hasFutureReservation = hasActiveBooking && !isWalkInBlocked;

		let statusTag = "";
		if (room.status !== "AVAILABLE") {
			statusTag = "";
		} else if (walkIn && isWalkInBlocked) {
			const todayEnd = new Date(todayKey + 86_400_000);
			const blockingBooking = roomBookings.find((b) => {
				if (b.status === "CHECKED_IN") return true;
				const bCheckIn = new Date(b.checkIn);
				const bCheckOut = new Date(b.checkOut);
				return bCheckIn < todayEnd && bCheckOut > todayStart;
			});
			if (blockingBooking?.status === "CHECKED_IN") {
				statusTag = " [OCCUPIED]";
			} else if (blockingBooking) {
				statusTag = ` [RESERVED ${formatShortDateTime(blockingBooking.checkIn)} - ${formatShortDateTime(blockingBooking.checkOut)}]`;
			} else {
				statusTag = "";
			}
		} else if (!walkIn && hasActiveBooking) {
			statusTag = "";
		} else if (walkIn && hasFutureReservation && isBookedToday) {
			const futureBooking = roomBookings.find((b) => {
				const bStart = new Date(b.checkIn);
				bStart.setHours(0, 0, 0, 0);
				return bStart.getTime() > todayKey;
			});
			statusTag = futureBooking
				? ` [RESERVED ${formatShortDateTime(futureBooking.checkIn)} - ${formatShortDateTime(futureBooking.checkOut)}]`
				: "";
		} else if (walkIn && hasActiveBooking) {
			const futureBooking = roomBookings.find((b) => {
				const bCheckIn = new Date(b.checkIn);
				return bCheckIn > now;
			});
			statusTag = futureBooking
				? ` [RESERVED ${formatShortDateTime(futureBooking.checkIn)} - ${formatShortDateTime(futureBooking.checkOut)}]`
				: "";
		}

		const isMonthlyDisabled = bookingType === "MONTHLY" && !room.monthlyPrice;

		const priceLabel =
			bookingType === "MONTHLY" && room.monthlyPrice
				? `₱${Number(room.monthlyPrice).toFixed(0)}/mo`
				: `₱${Number(room.basePrice).toFixed(2)}/day`;

		return {
			value: room.id.toString(),
			label: `${room.roomNumber} - ${room.type} (${priceLabel}) · ${room.capacity} pax${statusTag}${isMonthlyDisabled ? " [NO MONTHLY RATE]" : ""}`,
			disabled:
				["MAINTENANCE", "OUT_OF_ORDER"].includes(room.status) ||
				(walkIn && isWalkInBlocked) ||
				isMonthlyDisabled,
		};
	});

	const getBookedDatesForRoom = (roomId: number): Set<number> => {
		return bookedDaysByRoom.get(roomId) ?? new Set();
	};

	return { roomOptions, getBookedDatesForRoom };
}
