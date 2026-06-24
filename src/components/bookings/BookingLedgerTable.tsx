import { TrashIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import { formatManilaDateTime } from "@/lib/date/manila";
import {
	formatLedgerCategory,
	formatPaymentMethod,
} from "@/lib/ledger/display.helpers";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

import {
	canDeleteLedgerTransaction,
	canPayLedgerTransaction,
} from "./ledger/ledger-ui.helpers";
import { PaymentReferenceDialog } from "./ledger/PaymentReferenceDialog";

function PaymentMethodCell({
	transaction,
}: {
	transaction: LedgerTransactionListItem;
}) {
	const [open, setOpen] = useState(false);
	const { isPaid, paymentMethod, referenceNumber } = transaction;
	const showReference =
		isPaid &&
		(paymentMethod === "GCASH" || paymentMethod === "BANK_TRANSFER") &&
		referenceNumber?.trim();

	if (!showReference) {
		return <span>{formatPaymentMethod(paymentMethod)}</span>;
	}

	return (
		<>
			<div className="flex items-center gap-2">
				<span>{formatPaymentMethod(paymentMethod)}</span>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setOpen(true)}
				>
					View
				</Button>
			</div>
			<PaymentReferenceDialog
				open={open}
				onOpenChange={setOpen}
				paymentMethod={paymentMethod}
				referenceNumber={referenceNumber ?? ""}
			/>
		</>
	);
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
				formatManilaDateTime(row.original.createdAt, "MMM d, yyyy h:mm a"),
		},
		{
			accessorKey: "category",
			header: "Category",
			cell: ({ row }) => formatLedgerCategory(row.original.category),
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => (
				<div className="flex flex-col gap-1">
					{row.original.utilityType ? (
						<Badge variant="secondary" className="w-fit">
							{row.original.utilityType}
						</Badge>
					) : null}
					<span>{row.original.description ?? "—"}</span>
				</div>
			),
		},
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => {
				const amount = Number(row.original.amount);
				return (
					<span
						className={`whitespace-nowrap ${amount < 0 ? "text-destructive" : undefined}`}
					>
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
					<Badge variant="secondary" className="whitespace-nowrap">
						Paid
					</Badge>
				) : (
					<Badge variant="outline" className="whitespace-nowrap">
						Unpaid
					</Badge>
				),
		},
		{
			accessorKey: "paymentMethod",
			header: "Payment",
			cell: ({ row }) => <PaymentMethodCell transaction={row.original} />,
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

	return (
		<DataTable columns={columns} data={transactions} className="text-xs" />
	);
}
