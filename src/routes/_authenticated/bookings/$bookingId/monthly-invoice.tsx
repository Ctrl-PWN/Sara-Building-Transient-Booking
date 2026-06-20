import { createFileRoute, redirect } from "@tanstack/react-router";
import { monthlyInvoiceSearchSchema } from "@/lib/invoices/schemas";

export const Route = createFileRoute(
	"/_authenticated/bookings/$bookingId/monthly-invoice",
)({
	validateSearch: (search) => monthlyInvoiceSearchSchema.parse(search),
	beforeLoad: ({ params, search }) => {
		throw redirect({
			to: "/bookings/$bookingId/monthly-utilities",
			params: { bookingId: params.bookingId },
			search: { period: search.period },
		});
	},
});
