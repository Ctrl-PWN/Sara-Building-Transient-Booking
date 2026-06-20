import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense } from "react";
import { MonthlyInvoiceComposer } from "@/components/bookings/invoice/MonthlyInvoiceComposer";
import { Spinner } from "@/components/ui/spinner";
import { bookingQueries } from "@/lib/bookings/bookings.queries";
import { monthlyInvoiceSearchSchema } from "@/lib/invoices/schemas";
import { ledgerQueries } from "@/lib/ledger/ledger.queries";
import { getSession } from "@/lib/session/session.functions";

export const Route = createFileRoute(
	"/_authenticated/bookings/$bookingId/monthly-invoice",
)({
	validateSearch: (search) => monthlyInvoiceSearchSchema.parse(search),
	loader: async ({ params, context }) => {
		const id = Number(params.bookingId);
		try {
			const [session, booking, transactions] = await Promise.all([
				getSession(),
				context.queryClient.ensureQueryData(bookingQueries.detail(id)),
				context.queryClient.ensureQueryData(ledgerQueries.transactions(id)),
			]);

			if (booking.bookingType !== "MONTHLY") {
				throw notFound();
			}

			const issuedBy = session?.user
				? `${session.user.firstName} ${session.user.lastName}`.trim()
				: "Unknown";
			return { booking, transactions, issuedBy };
		} catch {
			throw notFound();
		}
	},
	component: MonthlyInvoiceRoute,
});

function MonthlyInvoiceRoute() {
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
			<MonthlyInvoicePage />
		</Suspense>
	);
}

function MonthlyInvoicePage() {
	const { booking, transactions, issuedBy } = Route.useLoaderData();
	const { period } = Route.useSearch();

	return (
		<MonthlyInvoiceComposer
			booking={booking}
			transactions={transactions}
			issuedBy={issuedBy}
			initialPeriodIndex={period}
		/>
	);
}
