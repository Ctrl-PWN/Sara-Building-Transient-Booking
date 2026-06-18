import type { QueryClient } from "@tanstack/react-query";
import { mutationOptions } from "@tanstack/react-query";
import type { z } from "zod";
import { timelineKeys } from "@/lib/timeline/timeline.queries";
import {
	createRoom,
	deleteRoom,
	syncRoomStatuses,
	updateRoom,
	updateRoomStatus,
} from "./rooms.functions";
import { roomKeys } from "./rooms.queries";
import type {
	createRoomSchema,
	deleteRoomSchema,
	updateRoomSchema,
	updateRoomStatusSchema,
} from "./schemas";

export const roomMutations = {
	create: (queryClient: QueryClient) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof createRoomSchema>) =>
				createRoom({ data: input }),
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
			},
		}),

	update: (queryClient: QueryClient) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof updateRoomSchema>) =>
				updateRoom({ data: input }),
			onSuccess: (_data, { id }) => {
				void queryClient.invalidateQueries({ queryKey: roomKeys.detail(id) });
				void queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
			},
		}),

	updateStatus: (queryClient: QueryClient) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof updateRoomStatusSchema>) =>
				updateRoomStatus({ data: input }),
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
				void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
			},
		}),

	delete: (queryClient: QueryClient) =>
		mutationOptions({
			mutationFn: (input: z.infer<typeof deleteRoomSchema>) =>
				deleteRoom({ data: input }),
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
			},
		}),

	syncStatuses: (queryClient: QueryClient) =>
		mutationOptions({
			mutationFn: () => syncRoomStatuses({ data: undefined }),
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
			},
		}),
};
