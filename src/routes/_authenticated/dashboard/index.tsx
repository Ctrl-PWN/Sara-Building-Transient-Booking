import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DashboardDateHeader } from "@/components/dashboard/DashboardDateHeader";
import { OccupancyCard } from "@/components/dashboard/OccupancyCard";
import { OverdueFlagsCard } from "@/components/dashboard/OverdueFlagsCard";
import { TodayAtAGlanceCard } from "@/components/dashboard/TodayAtAGlanceCard";
import { TodayListCard } from "@/components/dashboard/TodayListCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { dashboardQueries } from "@/lib/dashboard/dashboard.queries";
import { todayIsoInManila } from "@/lib/date/manila";

export const Route = createFileRoute("/_authenticated/dashboard/")({
	component: DashboardPage,
	loader: async ({ context }) => {
		const today = todayIsoInManila();
		await context.queryClient.ensureQueryData(dashboardQueries.metrics(today));
	},
});

function DashboardPage() {
	const today = todayIsoInManila();
	const { data: metrics } = useSuspenseQuery(dashboardQueries.metrics(today));

	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-6 pb-8">
			<PageHeader
				title="Dashboard"
				description="Monitor availability, reservations, and occupancy across all units."
				actions={<DashboardDateHeader date={today} />}
			/>

			<section className="grid items-stretch gap-4 lg:grid-cols-3">
				<OccupancyCard occupancy={metrics.occupancy} />
				<TodayAtAGlanceCard
					checkInsCount={metrics.today.checkInsCount}
					checkOutsCount={metrics.today.checkOutsCount}
					pendingDepositsCount={metrics.pendingDepositsCount}
					activeBookingsCount={metrics.activeBookingsCount}
				/>
				<OverdueFlagsCard flags={metrics.overdueFlags} />
			</section>

			<section className="grid gap-4 lg:grid-cols-2">
				<TodayListCard
					title="Today's check-ins"
					bookings={metrics.today.checkIns}
					emptyMessage="No check-ins scheduled for today."
				/>
				<TodayListCard
					title="Today's check-outs"
					bookings={metrics.today.checkOuts}
					emptyMessage="No check-outs scheduled for today."
				/>
			</section>
		</main>
	);
}
