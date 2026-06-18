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
	| "name-desc";

type BookingsFilterBarProps = {
	bookingTypeFilter: string;
	sortBy: SortOption;
	onBookingTypeFilterChange: (value: string) => void;
	onSortByChange: (value: SortOption) => void;
};

const sortOptions: { value: SortOption; label: string }[] = [
	{ value: "checkIn-newest", label: "Check-in (newest)" },
	{ value: "checkIn-oldest", label: "Check-in (oldest)" },
	{ value: "name-asc", label: "Guest A–Z" },
	{ value: "name-desc", label: "Guest Z–A" },
];

const bookingTypeOptions = [
	{ value: "all", label: "All Types" },
	{ value: "DAILY", label: "Daily" },
	{ value: "MONTHLY", label: "Monthly" },
];

export function BookingsFilterBar({
	bookingTypeFilter,
	sortBy,
	onBookingTypeFilterChange,
	onSortByChange,
}: BookingsFilterBarProps) {
	return (
		<div className="flex flex-wrap items-center gap-2 pt-3">
			<Select
				value={bookingTypeFilter}
				onValueChange={(v) => {
					if (v) onBookingTypeFilterChange(v);
				}}
				items={bookingTypeOptions}
			>
				<SelectTrigger size="sm" className="w-auto min-w-36">
					<SelectValue placeholder="All Types" />
				</SelectTrigger>
				<SelectContent>
					{bookingTypeOptions.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
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
