import {
	CaretLeftIcon,
	CaretRightIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { computeBookingDisplayStatus } from "@/lib/bookings/status";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { BookingsFilterBar, type SortOption } from "./BookingsFilterBar";

function safeFormatDate(value: string, fmt: string): string {
	try {
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return value;
		return format(d, fmt);
	} catch {
		return value;
	}
}

const statusColorMap: Record<
	string,
	"default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
	RESERVED: "warning",
	CHECKED_IN: "success",
	CHECKED_OUT: "outline",
	CANCELLED: "destructive",
	EVICTED: "destructive",
	OVERDUE: "destructive",
	TRANSFERRED: "secondary",
};

type BookingsTableProps = {
	bookings: BookingWithRoom[];
	searchQuery: string;
	onSearchChange: (query: string) => void;
	emptyMessage?: string;
	bookingTypeFilter: string;
	sortBy: SortOption;
	onBookingTypeFilterChange: (value: string) => void;
	onSortByChange: (value: SortOption) => void;
};

export function BookingsTable({
	bookings,
	searchQuery,
	onSearchChange,
	emptyMessage = "No bookings found.",
	bookingTypeFilter,
	sortBy,
	onBookingTypeFilterChange,
	onSortByChange,
}: BookingsTableProps) {
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(1);
	const totalPages = Math.max(1, Math.ceil(bookings.length / pageSize));
	const safePage = Math.min(page, totalPages);
	const startIdx = (safePage - 1) * pageSize;
	const pageBookings = bookings.slice(startIdx, startIdx + pageSize);

	return (
		<Card>
			<CardHeader className="border-b border-border p-4 bg-muted/20">
				<div className="flex gap-4">
					<div className="relative flex-1 max-w-sm">
						<MagnifyingGlassIcon
							className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							size={18}
						/>
						<Input
							placeholder="Search guest name or ref..."
							className="pl-10"
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
						/>
					</div>
				</div>
				<BookingsFilterBar
					bookingTypeFilter={bookingTypeFilter}
					sortBy={sortBy}
					onBookingTypeFilterChange={onBookingTypeFilterChange}
					onSortByChange={onSortByChange}
				/>
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead>Ref</TableHead>
							<TableHead>Guest</TableHead>
							<TableHead>Dates</TableHead>
							<TableHead>Room</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-center">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{bookings.length === 0 && (
							<TableRow>
								<TableCell
									className="text-center text-muted-foreground py-8"
									colSpan={8}
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						)}
						{pageBookings.map((booking) => {
							const displayStatus =
								booking.status === "CHECKED_IN"
									? computeBookingDisplayStatus(
											booking.status,
											booking.checkOut,
										)
									: booking.status;
							return (
								<TableRow key={booking.id}>
									<TableCell className="font-mono text-xs text-muted-foreground">
										{booking.bookingRef}
									</TableCell>
									<TableCell>
										<p className="font-medium">
											{booking.firstName} {booking.lastName}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{booking.contactNumber}
										</p>
									</TableCell>
									<TableCell>
										<p className="text-sm">
											{safeFormatDate(
												booking.checkIn,
												"MMMM d, yyyy 'at' HH:mm",
											)}
											&rarr;
										</p>
										<p className="text-sm text-muted-foreground mt-0.5">
											{safeFormatDate(
												booking.checkOut,
												"MMMM d, yyyy 'at' HH:mm",
											)}
										</p>
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="font-mono">
											{booking.roomNumber}
										</Badge>
										<span className="text-xs text-muted-foreground ml-2">
											{booking.roomType}
										</span>
									</TableCell>
									<TableCell>
										<Badge
											variant="secondary"
											className="text-[10px] uppercase"
										>
											{booking.bookingType === "MONTHLY" ? "Monthly" : "Daily"}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant={statusColorMap[displayStatus]}>
											{displayStatus.replace("_", " ")}
										</Badge>
										{booking.paymentStatus === "OVERDUE" && (
											<Badge variant="destructive" className="ml-2">
												OVERDUE
											</Badge>
										)}
									</TableCell>
									<TableCell className="text-center">
										<Button
											variant="ghost"
											size="sm"
											nativeButton={false}
											render={
												<Link
													to="/bookings/$bookingId"
													params={{ bookingId: String(booking.id) }}
												/>
											}
										>
											Manage
										</Button>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
				{bookings.length > 0 && (
					<div className="flex items-center justify-between px-4 py-3 border-t">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span>Showing</span>
							<Select
								value={String(pageSize)}
								onValueChange={(v) => {
									setPageSize(Number(v));
									setPage(1);
								}}
							>
								<SelectTrigger size="sm" className="w-16">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="5">5</SelectItem>
									<SelectItem value="10">10</SelectItem>
									<SelectItem value="25">25</SelectItem>
									<SelectItem value="50">50</SelectItem>
								</SelectContent>
							</Select>
							<span>of {bookings.length} bookings</span>
						</div>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								disabled={safePage <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								<CaretLeftIcon size={14} />
							</Button>
							<span className="text-sm px-2">
								{safePage} / {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={safePage >= totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								<CaretRightIcon size={14} />
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
