import { TrashIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

import {
	canDeleteLedgerTransaction,
	canPayLedgerTransaction,
} from "./ledger/ledger-ui.helpers";

function formatCategory(category: string): string {
	return category
		.split("_")
		.map((part) => part.charAt(0) + part.slice(1).toLowerCase())
		.join(" ");
}

function formatPaymentMethod(method: string | null): string {
	if (!method) return "—";
	if (method === "BANK_TRANSFER") return "Bank transfer";
	return method.charAt(0) + method.slice(1).toLowerCase();
}

type BookingLedgerTableProps = {
	transactions: LedgerTransactionListItem[];
	bookingStatus: string;
	showActions?: boolean;
	onPay?: (transaction: LedgerTransactionListItem) => void;
	onDelete?: (transaction: LedgerTransactionListItem) => void;
};

export function BookingLedgerTable({
	transactions,
	bookingStatus,
	showActions = false,
	onPay,
	onDelete,
}: BookingLedgerTableProps) {
	const columns: ColumnDef<LedgerTransactionListItem>[] = [
		{
			accessorKey: "createdAt",
			header: "Date",
			cell: ({ row }) =>
				format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a"),
		},
		{
			accessorKey: "category",
			header: "Category",
			cell: ({ row }) => formatCategory(row.original.category),
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => row.original.description ?? "—",
		},
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => {
				const amount = Number(row.original.amount);
				return (
					<span className={`whitespace-nowrap ${amount < 0 ? "text-destructive" : undefined}`}>
						{formatPeso(amount)}
					</span>
				);
			},
		},
		{
			accessorKey: "isPaid",
			header: "Status",
			cell: ({ row }) =>
				row.original.isPaid ? (
					<Badge variant="secondary" className="whitespace-nowrap">Paid</Badge>
				) : (
					<Badge variant="outline" className="whitespace-nowrap">Unpaid</Badge>
				),
		},
		{
			accessorKey: "paymentMethod",
			header: "Payment",
			cell: ({ row }) => formatPaymentMethod(row.original.paymentMethod),
		},
	];

	if (showActions) {
		columns.push({
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const transaction = row.original;
				const canPay = canPayLedgerTransaction(transaction, bookingStatus);
				const canDelete = canDeleteLedgerTransaction(
					transaction,
					bookingStatus,
				);

				if (!canPay && !canDelete) return null;

				return (
					<div className="flex justify-end gap-2">
						{canPay && onPay ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => onPay(transaction)}
							>
								Pay
							</Button>
						) : null}
						{canDelete && onDelete ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => onDelete(transaction)}
								aria-label="Delete charge"
							>
								<TrashIcon size={16} />
							</Button>
						) : null}
					</div>
				);
			},
		});
	}

	return <DataTable columns={columns} data={transactions} className="text-xs" />;
}
