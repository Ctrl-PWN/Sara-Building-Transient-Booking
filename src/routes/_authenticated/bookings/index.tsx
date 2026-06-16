import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, useMemo, useState } from "react";
import { z } from "zod";
import type { SortOption } from "@/components/bookings/BookingsFilterBar";
import { BookingsPageHeader } from "@/components/bookings/BookingsPageHeader";
import { BookingsTable } from "@/components/bookings/BookingsTable";
import { CreateBookingDialog } from "@/components/bookings/CreateBookingDialog";
import { FeedbackDialog } from "@/components/ui/feedback-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookingQueries } from "@/lib/bookings/bookings.queries";
import { computeBookingDisplayStatus } from "@/lib/bookings/status";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { roomQueries } from "@/lib/rooms/rooms.queries";

const bookingsSearchSchema = z.object({
	tab: z.enum(["active", "history"]).optional().catch("active"),
});

export const Route = createFileRoute("/_authenticated/bookings/")({
	validateSearch: (search) => bookingsSearchSchema.parse(search),
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(bookingQueries.list());
		await context.queryClient.ensureQueryData(bookingQueries.history());
		await context.queryClient.ensureQueryData(roomQueries.list());
	},
	component: BookingsRoute,
});

function BookingsRoute() {
	return (
		<Suspense
			fallback={
				<div className="px-4 py-20 text-center text-muted-foreground">
					Loading...
				</div>
			}
		>
			<BookingsListPage />
		</Suspense>
	);
}

function BookingsListPage() {
	const { data: bookings } = useSuspenseQuery(bookingQueries.list());
	const { data: historyBookings } = useSuspenseQuery(bookingQueries.history());
	const { data: rooms } = useSuspenseQuery(roomQueries.list());
	const navigate = useNavigate();
	const search = Route.useSearch();
	const activeTab = search.tab ?? "active";

	const [isAddOpen, setIsAddOpen] = useState(false);
	const [walkIn, setWalkIn] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [roomFilter, setRoomFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState<SortOption>("checkIn-newest");

	const activeStatusOptions = useMemo(
		() => [
			{ value: "RESERVED", label: "Reserved" },
			{ value: "CHECKED_IN", label: "Checked-In" },
			{ value: "OVERDUE", label: "Overdue" },
		],
		[],
	);

	const historyStatusOptions = useMemo(
		() => [
			{ value: "CHECKED_OUT", label: "Checked-Out" },
			{ value: "CANCELLED", label: "Cancelled" },
			{ value: "EVICTED", label: "Evicted" },
			{ value: "TRANSFERRED", label: "Transferred" },
		],
		[],
	);

	const filterBookings = (list: BookingWithRoom[]) => {
		let result = list;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(b) =>
					b.firstName.toLowerCase().includes(q) ||
					b.lastName.toLowerCase().includes(q) ||
					b.bookingRef.toLowerCase().includes(q),
			);
		}

		if (roomFilter !== "all") {
			const roomId = Number(roomFilter);
			result = result.filter((b) => b.roomId === roomId);
		}

		if (statusFilter !== "all") {
			if (statusFilter === "OVERDUE") {
				result = result.filter((b) => {
					if (b.status !== "CHECKED_IN") return false;
					return (
						computeBookingDisplayStatus(b.status, b.checkOut) === "OVERDUE"
					);
				});
			} else {
				result = result.filter((b) => b.status === statusFilter);
			}
		}

		const sorted = [...result];
		switch (sortBy) {
			case "name-asc":
				sorted.sort((a, b) =>
					`${a.firstName} ${a.lastName}`.localeCompare(
						`${b.firstName} ${b.lastName}`,
					),
				);
				break;
			case "name-desc":
				sorted.sort((a, b) =>
					`${b.firstName} ${b.lastName}`.localeCompare(
						`${a.firstName} ${a.lastName}`,
					),
				);
				break;
			case "checkIn-newest":
				sorted.sort((a, b) => b.checkIn.localeCompare(a.checkIn));
				break;
			case "checkIn-oldest":
				sorted.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
				break;
			case "room":
				sorted.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
				break;
			case "status":
				sorted.sort((a, b) => a.status.localeCompare(b.status));
				break;
			default:
				break;
		}

		return sorted;
	};

	const filteredActive = filterBookings(bookings);
	const filteredHistory = filterBookings(historyBookings);

	const handleTabChange = (value: string) => {
		void navigate({
			to: "/bookings",
			search: { tab: value as "active" | "history" },
		});
	};

	return (
		<main className="page-wrap px-4 py-6 pb-8">
			<div className="space-y-8">
				<BookingsPageHeader
					onNewReservation={() => {
						setWalkIn(false);
						setIsAddOpen(true);
					}}
					onWalkIn={() => {
						setWalkIn(true);
						setIsAddOpen(true);
					}}
				/>

				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					orientation="horizontal"
					className="flex-col w-full"
				>
					<TabsList>
						<TabsTrigger value="active">Active</TabsTrigger>
						<TabsTrigger value="history">History</TabsTrigger>
					</TabsList>
					<TabsContent value="active" className="mt-4">
						<BookingsTable
							bookings={filteredActive}
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							emptyMessage="No active bookings."
							roomFilter={roomFilter}
							statusFilter={statusFilter}
							sortBy={sortBy}
							rooms={rooms}
							statusOptions={activeStatusOptions}
							onRoomFilterChange={setRoomFilter}
							onStatusFilterChange={setStatusFilter}
							onSortByChange={setSortBy}
						/>
					</TabsContent>
					<TabsContent value="history" className="mt-4">
						<BookingsTable
							bookings={filteredHistory}
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							emptyMessage="No finished bookings yet."
							roomFilter={roomFilter}
							statusFilter={statusFilter}
							sortBy={sortBy}
							rooms={rooms}
							statusOptions={historyStatusOptions}
							onRoomFilterChange={setRoomFilter}
							onStatusFilterChange={setStatusFilter}
							onSortByChange={setSortBy}
						/>
					</TabsContent>
				</Tabs>

				<CreateBookingDialog
					open={isAddOpen}
					onOpenChange={(open) => {
						if (!open) setWalkIn(false);
						setIsAddOpen(open);
					}}
					rooms={rooms}
					bookings={bookings}
					walkIn={walkIn}
					onSuccess={(bookingRef) => {
						setIsAddOpen(false);
						setWalkIn(false);
						setSuccess(`Booking ${bookingRef} created successfully`);
					}}
					onError={(msg) => {
						setError(msg);
					}}
				/>

				<FeedbackDialog
					open={error != null}
					onClose={() => setError(null)}
					title="Error"
					message={error}
					type="error"
				/>

				<FeedbackDialog
					open={success != null}
					onClose={() => setSuccess(null)}
					title="Success"
					message={success}
					type="success"
				/>
			</div>
		</main>
	);
}
