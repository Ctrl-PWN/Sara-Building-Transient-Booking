import { queryOptions } from "@tanstack/react-query";
import { getRoomById, getRooms } from "./rooms.functions";

export const roomKeys = {
	all: ["rooms"] as const,
	lists: () => [...roomKeys.all, "list"] as const,
	detail: (id: number) => [...roomKeys.all, "detail", id] as const,
};

export const roomQueries = {
	list: () =>
		queryOptions({
			queryKey: roomKeys.lists(),
			queryFn: () => getRooms(),
		}),
	detail: (id: number) =>
		queryOptions({
			queryKey: roomKeys.detail(id),
			queryFn: () => getRoomById({ data: { id } }),
		}),
};
