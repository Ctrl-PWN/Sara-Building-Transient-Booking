import { ArrowLeftIcon } from "@phosphor-icons/react";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { BookingDetailHeader } from "@/components/bookings/BookingDetailHeader";
import { BookingInfoCards } from "@/components/bookings/BookingInfoCards";
import { BookingLedgerView } from "@/components/bookings/BookingLedgerView";
import { CancelBookingDialog } from "@/components/bookings/CancelBookingDialog";
import { CheckInBookingDialog } from "@/components/bookings/CheckInBookingDialog";
import { CheckOutBookingDialog } from "@/components/bookings/CheckOutBookingDialog";
import { EvictBookingDialog } from "@/components/bookings/EvictBookingDialog";
import { ExtendBookingDialog } from "@/components/bookings/ExtendBookingDialog";
import { TransferBookingDialog } from "@/components/bookings/TransferBookingDialog";
import { Spinner } from "@/components/ui/spinner";
import { bookingMutations } from "@/lib/bookings/bookings.mutations";
import { bookingQueries } from "@/lib/bookings/bookings.queries";
import { ledgerQueries } from "@/lib/ledger/ledger.queries";
import { roomQueries } from "@/lib/rooms/rooms.queries";

function BookingNotFound() {
	return (
		<main className="page-wrap px-4 py-6 pb-8">
			<div className="space-y-8">
				<Link
					to="/bookings"
					className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
				>
					<ArrowLeftIcon className="mr-2" size={16} />
					Back to Bookings
				</Link>
				<div className="text-center py-20">
					<p className="text-muted-foreground">Booking not found.</p>
				</div>
			</div>
		</main>
	);
}

export const Route = createFileRoute("/_authenticated/bookings/$bookingId/")({
	loader: async ({ params, context }) => {
		const id = Number(params.bookingId);
		try {
			await Promise.all([
				context.queryClient.ensureQueryData(bookingQueries.detail(id)),
				context.queryClient.ensureQueryData(ledgerQueries.transactions(id)),
				context.queryClient.ensureQueryData(ledgerQueries.details(id)),
				context.queryClient.ensureQueryData(roomQueries.list()),
			]);
		} catch (error) {
			console.error(error);
			throw notFound();
		}
	},
	notFoundComponent: BookingNotFound,
	component: BookingDetailRoute,
});

function BookingDetailRoute() {
	return (
		<Suspense
			fallback={
				<main className="page-wrap px-4 py-6 pb-8">
					<div className="flex items-center justify-center py-20">
						<Spinner className="size-6 text-muted-foreground animate-spin" />
					</div>
				</main>
			}
		>
			<BookingDetailPage />
		</Suspense>
	);
}

function BookingDetailPage() {
	const { bookingId } = Route.useParams();
	const numericBookingId = Number(bookingId);
	const queryClient = useQueryClient();
	const { data: booking } = useSuspenseQuery(
		bookingQueries.detail(numericBookingId),
	);
	const { data: rooms } = useSuspenseQuery(roomQueries.list());
	const [cancelOpen, setCancelOpen] = useState(false);
	const [evictOpen, setEvictOpen] = useState(false);
	const [checkInOpen, setCheckInOpen] = useState(false);
	const [checkOutOpen, setCheckOutOpen] = useState(false);
	const [transferOpen, setTransferOpen] = useState(false);
	const [extendOpen, setExtendOpen] = useState(false);

	const updateStatus = useMutation(bookingMutations.updateStatus(queryClient));
	const transferMutation = useMutation(
		bookingMutations.transfer(queryClient, numericBookingId),
	);
	const extendMutation = useMutation(
		bookingMutations.extend(queryClient, numericBookingId),
	);

	const availableRooms = rooms.filter(
		(r) => r.status === "AVAILABLE" && r.id !== booking.roomId,
	);

	const handleCancel = (reason: string) => {
		updateStatus.mutate({
			bookingRef: booking.bookingRef,
			status: "CANCELLED",
			cancellationReason: reason,
		});
		setCancelOpen(false);
	};

	const handleEvict = (reason: string) => {
		updateStatus.mutate({
			bookingRef: booking.bookingRef,
			status: "EVICTED",
			evictionReason: reason,
		});
		setEvictOpen(false);
	};

	const handleTransfer = (targetRoomId: number, reason: string) => {
		transferMutation.mutate({
			bookingRef: booking.bookingRef,
			targetRoomId,
			reason,
		});
		setTransferOpen(false);
	};

	const handleExtend = async (values: {
		newCheckOutDate: string;
		withCashAdvance: boolean;
		paymentMethod: string;
		referenceNumber: string;
	}) => {
		try {
			await extendMutation.mutateAsync({
				bookingRef: booking.bookingRef,
				newCheckOutDate: values.newCheckOutDate,
				withCashAdvance: values.withCashAdvance,
				paymentMethod: values.paymentMethod as
					| "CASH"
					| "GCASH"
					| "BANK_TRANSFER",
				referenceNumber: values.referenceNumber,
			});
			setExtendOpen(false);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to extend booking";
			toast.error("Cannot extend booking", { description: message });
		}
	};

	return (
		<main className="page-wrap px-4 py-6 pb-8">
			<div className="space-y-8">
				<BookingDetailHeader
					booking={booking}
					onCancelClick={() => setCancelOpen(true)}
					onEvictClick={() => setEvictOpen(true)}
					onCheckIn={() => setCheckInOpen(true)}
					onCheckOut={() => setCheckOutOpen(true)}
					onTransferClick={() => setTransferOpen(true)}
					onExtendClick={() => setExtendOpen(true)}
				/>

				<BookingInfoCards booking={booking} />

				<BookingLedgerView
					bookingId={numericBookingId}
					bookingStatus={booking.status}
					bookingType={booking.bookingType}
					checkIn={booking.checkIn}
					checkOut={booking.checkOut}
				/>

				<CancelBookingDialog
					open={cancelOpen}
					onOpenChange={setCancelOpen}
					bookingRef={booking.bookingRef}
					guestName={`${booking.firstName} ${booking.lastName}`}
					onConfirm={handleCancel}
				/>

				<EvictBookingDialog
					open={evictOpen}
					onOpenChange={setEvictOpen}
					guestName={`${booking.firstName} ${booking.lastName}`}
					roomNumber={booking.roomNumber}
					onConfirm={handleEvict}
				/>

				<CheckInBookingDialog
					open={checkInOpen}
					onOpenChange={setCheckInOpen}
					booking={booking}
					bookingId={numericBookingId}
				/>

				<CheckOutBookingDialog
					open={checkOutOpen}
					onOpenChange={setCheckOutOpen}
					booking={booking}
					bookingId={numericBookingId}
				/>

				<TransferBookingDialog
					open={transferOpen}
					onOpenChange={setTransferOpen}
					booking={booking}
					availableRooms={availableRooms}
					onConfirm={handleTransfer}
				/>

				<ExtendBookingDialog
					open={extendOpen}
					onOpenChange={setExtendOpen}
					booking={booking}
					onConfirm={handleExtend}
				/>
			</div>
		</main>
	);
}
