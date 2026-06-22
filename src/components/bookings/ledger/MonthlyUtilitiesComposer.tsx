import { ArrowLeftIcon, PlusIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
	getLatestPeriodIndex,
	listMonthlyBillingPeriods,
} from "@/lib/bookings/monthly-billing-periods";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatGuestName } from "@/lib/bookings/types";
import { formatManilaDateTime } from "@/lib/date/manila";
import { ledgerMutations } from "@/lib/ledger/ledger.mutations";
import { ledgerQueries } from "@/lib/ledger/ledger.queries";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

import { MonthlyInvoicePdfPreview } from "../invoice/MonthlyInvoicePdfPreview";
import { LedgerPaymentFieldsSection } from "./LedgerPaymentFieldsSection";
import { MonthlyUtilitiesUtilityRow } from "./MonthlyUtilitiesUtilityRow";
import {
	buildDefaultUtilityItems,
	getExistingMainTypesInPeriod,
	getUtilityTransactionsInPeriod,
	resetUtilityFormForPeriod,
	utilitiesToInvoiceLines,
} from "./monthly-utilities.helpers";
import { useMonthlyUtilitiesForm } from "./useMonthlyUtilitiesForm";

type MonthlyUtilitiesComposerProps = {
	booking: BookingWithRoom;
	transactions: LedgerTransactionListItem[];
	issuedBy: string;
	initialPeriodIndex: number;
};

function formatPaymentMethod(method: string | null): string {
	if (!method) return "—";
	if (method === "BANK_TRANSFER") return "Bank transfer";
	return method.charAt(0) + method.slice(1).toLowerCase();
}

export function MonthlyUtilitiesComposer({
	booking,
	transactions,
	issuedBy,
	initialPeriodIndex,
}: MonthlyUtilitiesComposerProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const mutation = useMutation(
		ledgerMutations.generateUtilityPayments(queryClient, booking.id),
	);

	const periods = listMonthlyBillingPeriods(booking.checkIn, booking.checkOut);
	const fallbackIndex = getLatestPeriodIndex(periods);
	const periodSelectItems = periods.map((period) => ({
		value: String(period.index),
		label: period.label,
	}));
	const clampedInitial =
		periods.length === 0
			? 0
			: Math.min(Math.max(initialPeriodIndex, 0), periods.length - 1);

	const form = useMonthlyUtilitiesForm({
		defaultPeriodIndex: clampedInitial,
		defaultItems: buildDefaultUtilityItems(
			getExistingMainTypesInPeriod(
				transactions,
				periods[clampedInitial] ?? periods[fallbackIndex],
			),
		),
		onSubmit: async (values) => {
			try {
				const result = await mutation.mutateAsync({
					bookingId: booking.id,
					periodIndex: values.periodIndex,
					items: values.items,
					paymentMethod: values.paymentMethod,
					referenceNumber: values.referenceNumber,
				});

				if (result.inserted === 0) {
					toast.info("No new utility payments to record", {
						description:
							"All selected utilities are already recorded for this period.",
					});
				} else {
					toast.success(
						`Recorded ${result.inserted} utility payment${result.inserted === 1 ? "" : "s"}`,
					);
				}

				const freshTransactions = await queryClient.fetchQuery(
					ledgerQueries.transactions(booking.id),
				);
				resetUtilityFormForPeriod(
					form,
					periods,
					values.periodIndex,
					freshTransactions,
				);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to record utility payments";
				toast.error("Cannot record utility payments", {
					description: message,
				});
			}
		},
	});

	const periodIndex = form.store.state.values.periodIndex;
	const selectedPeriod = periods[periodIndex];

	const recordedUtilities = useMemo(() => {
		if (!selectedPeriod) return [];
		return getUtilityTransactionsInPeriod(transactions, selectedPeriod);
	}, [transactions, selectedPeriod]);

	const invoiceUtilities = useMemo(() => {
		if (!selectedPeriod) return [];
		return utilitiesToInvoiceLines(transactions, selectedPeriod);
	}, [transactions, selectedPeriod]);

	const roomCharge = Number(booking.roomMonthlyPrice) || 0;

	const handlePeriodChange = (value: string | null) => {
		if (value == null) return;
		const next = Number(value);
		form.setFieldValue("periodIndex", next);
		resetUtilityFormForPeriod(form, periods, next, transactions);
		void navigate({
			to: "/bookings/$bookingId/monthly-utilities",
			params: { bookingId: String(booking.id) },
			search: { period: next },
			replace: true,
		});
	};

	if (periods.length === 0) {
		return (
			<main className="page-wrap px-4 py-6 pb-8">
				<BackLink booking={booking} />
				<p className="text-muted-foreground">
					No billing periods available for this booking.
				</p>
			</main>
		);
	}

	return (
		<main className="page-wrap px-4 py-6 pb-8">
			<div className="space-y-6">
				<BackLink booking={booking} />

				<div>
					<h2 className="text-2xl font-serif tracking-tight text-foreground">
						Monthly utilities
					</h2>
					<p className="text-sm text-muted-foreground">
						{formatGuestName(booking)} · Room {booking.roomNumber}
					</p>
				</div>

				<div className="space-y-2">
					{/* biome-ignore lint/a11y/noLabelWithoutControl: Select is a custom control */}
					<label className="text-sm font-medium">Billing period</label>
					<Select
						value={String(periodIndex)}
						items={periodSelectItems}
						onValueChange={handlePeriodChange}
					>
						<SelectTrigger className="w-full max-w-md">
							<SelectValue placeholder="Select period" />
						</SelectTrigger>
						<SelectContent>
							{periods.map((period) => (
								<SelectItem key={period.index} value={String(period.index)}>
									{period.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Recorded this period</CardTitle>
							</CardHeader>
							<CardContent>
								{recordedUtilities.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No utility charges recorded for this period yet.
									</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Type</TableHead>
												<TableHead>Description</TableHead>
												<TableHead>Amount</TableHead>
												<TableHead>Payment</TableHead>
												<TableHead>Date</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{recordedUtilities.map((tx) => (
												<TableRow key={tx.id}>
													<TableCell>
														{tx.utilityType ? (
															<Badge variant="secondary">
																{tx.utilityType}
															</Badge>
														) : (
															"—"
														)}
													</TableCell>
													<TableCell>{tx.description ?? "—"}</TableCell>
													<TableCell>{formatPeso(Number(tx.amount))}</TableCell>
													<TableCell>
														{formatPaymentMethod(tx.paymentMethod)}
													</TableCell>
													<TableCell>
														{formatManilaDateTime(tx.createdAt)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Add utilities</CardTitle>
							</CardHeader>
							<CardContent>
								<form
									className="space-y-4"
									onSubmit={(event) => {
										event.preventDefault();
										event.stopPropagation();
										void form.handleSubmit();
									}}
								>
									<form.AppForm>
										<form.Field name="items" mode="array">
											{(itemsField) => (
												<div className="rounded-lg border p-4 space-y-3">
													<div className="flex items-center justify-between">
														<div>
															<p className="text-sm font-medium">
																New utility charges
															</p>
															<p className="text-xs text-muted-foreground">
																Main utilities can only be recorded once per
																period. Add more with Other.
															</p>
														</div>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() =>
																itemsField.pushValue({
																	utilityType: "OTHER",
																	amount: 0,
																	description: "",
																})
															}
														>
															<PlusIcon data-icon="inline-start" />
															Add utility
														</Button>
													</div>

													{itemsField.state.value.length === 0 ? (
														<p className="text-xs text-muted-foreground">
															All main utilities are recorded for this period.
															Use Add utility for additional charges.
														</p>
													) : (
														<div className="space-y-3">
															{itemsField.state.value.map((item, index) => (
																<MonthlyUtilitiesUtilityRow
																	// biome-ignore lint/suspicious/noArrayIndexKey: tanstack-form array field
																	key={`${item.utilityType}-${index}`}
																	form={form}
																	index={index}
																	utilityType={item.utilityType}
																	canRemove={item.utilityType === "OTHER"}
																	onRemove={() => itemsField.removeValue(index)}
																/>
															))}
														</div>
													)}
												</div>
											)}
										</form.Field>

										<form.Subscribe selector={(state) => state.values.items}>
											{(items) => {
												const total = items.reduce(
													(sum, item) =>
														sum +
														(Number.isFinite(item.amount) ? item.amount : 0),
													0,
												);

												return (
													<>
														{items.length > 0 ? (
															<div className="rounded-lg border p-4 space-y-3">
																<p className="text-sm font-medium">Payment</p>
																<LedgerPaymentFieldsSection form={form} />
															</div>
														) : null}

														<div className="rounded-lg border bg-muted/40 p-4 text-sm">
															<div className="flex justify-between font-semibold">
																<span>Total to record</span>
																<span>{formatPeso(total)}</span>
															</div>
														</div>

														{items.length > 0 ? (
															<form.SubmitButton
																label={
																	mutation.isPending
																		? "Recording…"
																		: "Record payments"
																}
																className="w-full sm:w-auto"
															/>
														) : null}
													</>
												);
											}}
										</form.Subscribe>
									</form.AppForm>
								</form>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-3">
						<div>
							<h3 className="text-lg font-medium">Invoice preview</h3>
							<p className="text-sm text-muted-foreground">
								Monthly room charge
								{invoiceUtilities.length > 0
									? " plus recorded utilities for this period"
									: " for this period"}
								.
							</p>
						</div>
						{selectedPeriod ? (
							<MonthlyInvoicePdfPreview
								booking={booking}
								period={selectedPeriod}
								roomCharge={roomCharge}
								utilities={invoiceUtilities}
								issuedBy={issuedBy}
							/>
						) : null}
					</div>
				</div>
			</div>
		</main>
	);
}

function BackLink({ booking }: { booking: BookingWithRoom }) {
	return (
		<Link
			to="/bookings/$bookingId"
			params={{ bookingId: String(booking.id) }}
			className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
		>
			<ArrowLeftIcon className="mr-2" size={16} />
			Back to {formatGuestName(booking)}
		</Link>
	);
}
