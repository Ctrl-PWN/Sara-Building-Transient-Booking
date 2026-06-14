import type { OccupancySummary } from "@/lib/dashboard/dashboard.types";

type OccupancyCardProps = {
	occupancy: OccupancySummary;
};

export function OccupancyCard({ occupancy }: OccupancyCardProps) {
	const { totalRooms, occupiedRooms, rate } = occupancy;

	return (
		<article className="block-card flex h-full flex-col p-6 sm:p-8">
			<p className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
				Occupancy rate
			</p>
			<div className="mt-4">
				<p className="font-display text-6xl font-medium tracking-tight text-on-surface sm:text-7xl">
					{rate}
					<span className="text-3xl text-on-surface-variant sm:text-4xl">
						%
					</span>
				</p>
			</div>
			<p className="mt-4 font-body text-sm font-medium tracking-tight text-on-surface-variant">
				{occupiedRooms} of {totalRooms} rooms occupied
			</p>
			<div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
				<div
					className="h-full rounded-full bg-status-occupied transition-all duration-500"
					style={{ width: `${rate}%` }}
				/>
			</div>
		</article>
	);
}
