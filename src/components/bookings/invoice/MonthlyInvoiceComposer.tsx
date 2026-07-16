import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getLatestPeriodIndex,
	isWithinPeriod,
	listMonthlyBillingPeriods,
} from "@/lib/bookings/monthly-billing-periods";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import type { BookingWithRoom } from "@/lib/bookings/types";
import { formatGuestName } from "@/lib/bookings/types";
import type { MonthlyInvoiceUtilityLine } from "@/lib/invoices/schemas";
import type { LedgerTransactionListItem } from "@/lib/ledger/types";

import { MonthlyInvoicePdfPreview } from "./MonthlyInvoicePdfPreview";
import { MonthlyInvoiceUtilitySection } from "./MonthlyInvoiceUtilityRow";
import { useMonthlyInvoiceForm } from "./useMonthlyInvoiceForm";

type MonthlyInvoiceComposerProps = {
	booking: BookingWithRoom;
	transactions: LedgerTransactionListItem[];
	issuedBy: string;
	initialPeriodIndex: number;
};

export function MonthlyInvoiceComposer({
	booking,
	transactions,
	issuedBy,
	initialPeriodIndex,
}: MonthlyInvoiceComposerProps) {
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

	const [submitted, setSubmitted] = useState<{
		periodIndex: number;
		utilities: MonthlyInvoiceUtilityLine[];
	} | null>(null);

	const form = useMonthlyInvoiceForm({
		defaultPeriodIndex: clampedInitial,
		onSubmit: (values) => {
			setSubmitted({
				periodIndex: values.periodIndex,
				utilities: values.utilities,
			});
		},
	});

	const roomCharge = Number(booking.roomMonthlyPrice) || 0;

	function prefillFromLedger(periodIndex: number) {
		const period = periods[periodIndex];
		if (!period) return;
		const matches = transactions.filter(
			(tx) => tx.utilityType !== null && isWithinPeriod(tx.createdAt, period),
		);
		if (matches.length === 0) return;
		form.setFieldValue(
			"utilities",
			matches.map((tx) => ({
				utilityType: tx.utilityType ?? "OTHER",
				amount: Number(tx.amount) || 0,
				description: tx.description ?? "Utility charge",
			})),
		);
	}

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

	const previewProps = submitted
		? {
				period: periods[submitted.periodIndex] ?? periods[fallbackIndex],
				utilities: submitted.utilities,
			}
		: null;

	return (
		<main className="page-wrap px-4 py-6 pb-8">
			<div className="space-y-6">
				<BackLink booking={booking} />

				<div>
					<h2 className="text-2xl font-serif tracking-tight text-foreground">
						Monthly Invoice
					</h2>
					<p className="text-sm text-muted-foreground">
						{formatGuestName(booking)} · Room {booking.roomNumber}
					</p>
				</div>

				<div className="grid gap-6 lg:grid-cols-[380px_1fr]">
					<Card>
						<CardHeader>
							<CardTitle>Invoice details</CardTitle>
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
									<form.Subscribe
										selector={(state) => state.values.periodIndex}
									>
										{(periodIndex) => (
											<div className="space-y-2">
												{/* biome-ignore lint/a11y/noLabelWithoutControl: Select is a custom control */}
												<label className="text-sm font-medium">
													Billing period
												</label>
												<Select
													value={String(periodIndex)}
													items={periodSelectItems}
													onValueChange={(value) => {
														const next = Number(value);
														form.setFieldValue("periodIndex", next);
														prefillFromLedger(next);
													}}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select period" />
													</SelectTrigger>
													<SelectContent>
														{periods.map((period) => (
															<SelectItem
																key={period.index}
																value={String(period.index)}
															>
																{period.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										)}
									</form.Subscribe>

									<div className="rounded-lg border bg-muted/40 p-4 text-sm">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">
												Monthly room charge
											</span>
											<span className="font-medium">
												{formatPeso(roomCharge)}
											</span>
										</div>
										<p className="mt-1 text-xs text-muted-foreground">
											Auto-filled from the room's current monthly rate.
										</p>
									</div>

									<MonthlyInvoiceUtilitySection form={form} />

									<form.Subscribe selector={(state) => state.values.utilities}>
										{(utilities) => {
											const utilitiesTotal = utilities.reduce(
												(sum, u) =>
													sum + (Number.isFinite(u.amount) ? u.amount : 0),
												0,
											);
											return (
												<div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
													<div className="flex justify-between">
														<span className="text-muted-foreground">Room</span>
														<span className="font-medium">
															{formatPeso(roomCharge)}
														</span>
													</div>
													{utilitiesTotal > 0 ? (
														<div className="flex justify-between">
															<span className="text-muted-foreground">
																Utilities
															</span>
															<span className="font-medium">
																{formatPeso(utilitiesTotal)}
															</span>
														</div>
													) : null}
													<div className="flex justify-between border-t pt-2 font-semibold">
														<span>Total due</span>
														<span>
															{formatPeso(roomCharge + utilitiesTotal)}
														</span>
													</div>
												</div>
											);
										}}
									</form.Subscribe>

									<form.SubmitButton
										label="Generate invoice"
										className="w-full"
									/>
								</form.AppForm>
							</form>
						</CardContent>
					</Card>

					<div>
						{previewProps ? (
							<MonthlyInvoicePdfPreview
								booking={booking}
								period={previewProps.period}
								roomCharge={roomCharge}
								utilities={previewProps.utilities}
								issuedBy={issuedBy}
							/>
						) : (
							<div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
								Configure the invoice and click "Generate invoice" to preview
								and print.
							</div>
						)}
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
