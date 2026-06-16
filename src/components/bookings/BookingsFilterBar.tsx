import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export type SortOption =
	| "checkIn-newest"
	| "checkIn-oldest"
	| "name-asc"
	| "name-desc"
	| "room"
	| "status";

type StatusOption = {
	value: string;
	label: string;
};

type BookingsFilterBarProps = {
	roomFilter: string;
	statusFilter: string;
	sortBy: SortOption;
	rooms: { id: number; roomNumber: string; type: string }[];
	statusOptions: StatusOption[];
	onRoomFilterChange: (value: string) => void;
	onStatusFilterChange: (value: string) => void;
	onSortByChange: (value: SortOption) => void;
};

const sortOptions: { value: SortOption; label: string }[] = [
	{ value: "checkIn-newest", label: "Check-in (newest)" },
	{ value: "checkIn-oldest", label: "Check-in (oldest)" },
	{ value: "name-asc", label: "Guest A–Z" },
	{ value: "name-desc", label: "Guest Z–A" },
	{ value: "room", label: "Room number" },
	{ value: "status", label: "Status" },
];

export function BookingsFilterBar({
	roomFilter,
	statusFilter,
	sortBy,
	rooms,
	statusOptions,
	onRoomFilterChange,
	onStatusFilterChange,
	onSortByChange,
}: BookingsFilterBarProps) {
	return (
		<div className="flex flex-wrap items-center gap-2 pt-3">
			<Select
				value={roomFilter}
				onValueChange={(v) => {
					if (v) onRoomFilterChange(v);
				}}
				items={[
					{ value: "all", label: "All Rooms" },
					...rooms.map((r) => ({
						value: String(r.id),
						label: `${r.roomNumber} — ${r.type}`,
					})),
				]}
			>
				<SelectTrigger size="sm" className="w-auto min-w-36">
					<SelectValue placeholder="All Rooms" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Rooms</SelectItem>
					{rooms.map((r) => (
						<SelectItem key={r.id} value={String(r.id)}>
							{r.roomNumber} — {r.type}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={statusFilter}
				onValueChange={(v) => {
					if (v) onStatusFilterChange(v);
				}}
				items={[
					{ value: "all", label: "All Statuses" },
					...statusOptions.map((s) => ({
						value: s.value,
						label: s.label,
					})),
				]}
			>
				<SelectTrigger size="sm" className="w-auto min-w-36">
					<SelectValue placeholder="All Statuses" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Statuses</SelectItem>
					{statusOptions.map((s) => (
						<SelectItem key={s.value} value={s.value}>
							{s.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={sortBy}
				onValueChange={(v) => {
					if (v) onSortByChange(v as SortOption);
				}}
				items={sortOptions}
			>
				<SelectTrigger size="sm" className="w-auto min-w-40">
					<SelectValue placeholder="Sort by" />
				</SelectTrigger>
				<SelectContent>
					{sortOptions.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
