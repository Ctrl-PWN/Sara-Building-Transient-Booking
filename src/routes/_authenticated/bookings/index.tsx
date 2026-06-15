import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { z } from "zod";
import { BookingsPageHeader } from "@/components/bookings/BookingsPageHeader";
import { BookingsTable } from "@/components/bookings/BookingsTable";
import { CreateBookingDialog } from "@/components/bookings/CreateBookingDialog";
import { FeedbackDialog } from "@/components/ui/feedback-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookingQueries } from "@/lib/bookings/bookings.queries";
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

	const filterBookings = (list: typeof bookings) => {
		if (!searchQuery.trim()) return list;
		const q = searchQuery.toLowerCase();
		return list.filter(
			(b) =>
				b.firstName.toLowerCase().includes(q) ||
				b.lastName.toLowerCase().includes(q) ||
				b.bookingRef.toLowerCase().includes(q),
		);
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
						/>
					</TabsContent>
					<TabsContent value="history" className="mt-4">
						<BookingsTable
							bookings={filteredHistory}
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							emptyMessage="No finished bookings yet."
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
