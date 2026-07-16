import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense } from "react";
import { MonthlyUtilitiesComposer } from "@/components/bookings/ledger/MonthlyUtilitiesComposer";
import { Spinner } from "@/components/ui/spinner";
import { bookingQueries } from "@/lib/bookings/bookings.queries";
import { ledgerQueries } from "@/lib/ledger/ledger.queries";
import { monthlyUtilitiesSearchSchema } from "@/lib/ledger/schemas";
import { getSession } from "@/lib/session/session.functions";

export const Route = createFileRoute(
	"/_authenticated/bookings/$bookingId/monthly-utilities",
)({
	validateSearch: (search) => monthlyUtilitiesSearchSchema.parse(search),
	loader: async ({ params, context }) => {
		const id = Number(params.bookingId);
		try {
			const [session, booking] = await Promise.all([
				getSession(),
				context.queryClient.ensureQueryData(bookingQueries.detail(id)),
				context.queryClient.ensureQueryData(ledgerQueries.transactions(id)),
			]);

			if (
				booking.bookingType !== "MONTHLY" ||
				booking.status !== "CHECKED_IN"
			) {
				throw notFound();
			}

			const issuedBy = session?.user
				? `${session.user.firstName} ${session.user.lastName}`.trim()
				: "Unknown";

			return { booking, issuedBy };
		} catch {
			throw notFound();
		}
	},
	component: MonthlyUtilitiesRoute,
});

function MonthlyUtilitiesRoute() {
	return (
		<Suspense
			fallback={
				<main className="page-wrap px-4 py-6 pb-8">
					<div className="flex items-center justify-center py-20">
						<Spinner className="size-6 animate-spin text-muted-foreground" />
					</div>
				</main>
			}
		>
			<MonthlyUtilitiesPage />
		</Suspense>
	);
}

function MonthlyUtilitiesPage() {
	const { booking, issuedBy } = Route.useLoaderData();
	const { period } = Route.useSearch();
	const { data: transactions } = useSuspenseQuery(
		ledgerQueries.transactions(booking.id),
	);

	return (
		<MonthlyUtilitiesComposer
			booking={booking}
			transactions={transactions}
			issuedBy={issuedBy}
			initialPeriodIndex={period}
		/>
	);
}
