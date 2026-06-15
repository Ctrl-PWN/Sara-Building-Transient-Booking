import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import Fuse from "fuse.js";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateRoomSheet } from "@/components/rooms/CreateRoomSheet";
import { DeleteRoomDialog } from "@/components/rooms/DeleteRoomDialog";
import { EditRoomSheet } from "@/components/rooms/EditRoomSheet";
import { RoomTable } from "@/components/rooms/RoomTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { roomQueries } from "@/lib/rooms/rooms.queries";
import type { Room } from "@/lib/rooms/types";

export const Route = createFileRoute("/_authenticated/_admin/room-management/")(
	{
		component: RoomManagementPage,
	},
);

function RoomManagementPage() {
	const [search, setSearch] = useState("");
	const [createOpen, setCreateOpen] = useState(false);
	const [editRoom, setEditRoom] = useState<Room | null>(null);
	const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);

	const { data: rooms, isLoading } = useQuery(roomQueries.list());

	const itemList = rooms ?? [];
	const filtered = !search
		? itemList
		: search.length < 2
			? itemList.filter((r) => {
					const query = search.toLowerCase();
					return (
						r.roomNumber.toLowerCase().includes(query) ||
						r.type.toLowerCase().includes(query)
					);
				})
			: new Fuse(itemList, {
					keys: ["roomNumber", "type"],
					threshold: 0.2,
				})
					.search(search)
					.map((r) => r.item);

	return (
		<main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
			<PageHeader
				title="Room Management"
				description="Room inventory management for administrators."
				actions={
					<Button onClick={() => setCreateOpen(true)}>
						<PlusIcon data-icon="inline-start" />
						New room
					</Button>
				}
			/>

			<div className="relative max-w-sm">
				<MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search by room number or type..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-8"
				/>
			</div>

			<section className="block-card overflow-hidden">
				{isLoading ? (
					<div className="p-4">
						<Skeleton className="h-64 w-full rounded-xl" />
					</div>
				) : (
					<RoomTable
						rooms={filtered}
						onEdit={(room) => setEditRoom(room)}
						onDelete={(room) => setDeleteRoom(room)}
					/>
				)}
			</section>

			<CreateRoomSheet open={createOpen} onOpenChange={setCreateOpen} />
			<EditRoomSheet
				room={editRoom}
				open={editRoom !== null}
				onOpenChange={(o) => {
					if (!o) setEditRoom(null);
				}}
			/>
			<DeleteRoomDialog
				room={deleteRoom}
				open={deleteRoom !== null}
				onOpenChange={(o) => {
					if (!o) setDeleteRoom(null);
				}}
			/>
		</main>
	);
}
