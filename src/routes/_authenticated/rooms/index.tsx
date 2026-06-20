import { DoorIcon } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChangeRoomStatusDialog } from "@/components/rooms/ChangeRoomStatusDialog";
import { RoomCard } from "@/components/rooms/RoomCard";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { roomQueries } from "@/lib/rooms/rooms.queries";
import type { Room } from "@/lib/rooms/types";

export const Route = createFileRoute("/_authenticated/rooms/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(roomQueries.list());
	},
	component: RoomsRoute,
});

function RoomsRoute() {
	return (
		<Suspense
			fallback={
				<main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
					<PageHeader
						title="Rooms"
						description="Room inventory, status, and operational details."
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
						{Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
							<Skeleton key={n} className="h-40 w-full rounded-xl" />
						))}
					</div>
				</main>
			}
		>
			<RoomsListPage />
		</Suspense>
	);
}

function RoomsListPage() {
	const { data: rooms } = useSuspenseQuery(roomQueries.list());
	const [statusChangeRoom, setStatusChangeRoom] = useState<Room | null>(null);

	return (
		<main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
			<PageHeader
				title="Rooms"
				description="Room inventory, status, and operational details."
			/>

			{rooms.length === 0 ? (
				<section className="block-card overflow-hidden">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<DoorIcon />
							</EmptyMedia>
							<EmptyTitle>No rooms found</EmptyTitle>
							<EmptyDescription>
								There are no rooms available yet.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent />
					</Empty>
				</section>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
					{rooms.map((room: Room) => (
						<RoomCard
							key={room.id}
							room={room}
							onStatusClick={setStatusChangeRoom}
						/>
					))}
				</div>
			)}

			{statusChangeRoom ? (
				<ChangeRoomStatusDialog
					room={statusChangeRoom}
					open
					onOpenChange={(o) => {
						if (!o) setStatusChangeRoom(null);
					}}
				/>
			) : null}
		</main>
	);
}
