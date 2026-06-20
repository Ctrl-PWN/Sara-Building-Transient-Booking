import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { paymentMethodOptions } from "@/components/bookings/create-booking/create-booking-form.constants";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogFooter,
	DialogHeader,
	DialogOutsideScroll,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	dynamicSchemaValidators,
	formOptions,
	useAppForm,
} from "@/integrations/tanstack-form";
import { formatPeso } from "@/lib/bookings/stay-pricing";
import { ledgerMutations } from "@/lib/ledger/ledger.mutations";
import { ledgerQueries } from "@/lib/ledger/ledger.queries";

const MAIN_UTILITY_TYPES = ["ELECTRICITY", "WATER", "INTERNET"] as const;

const UTILITY_TYPE_LABELS: Record<string, string> = {
	ELECTRICITY: "Electricity",
	WATER: "Water",
	INTERNET: "Internet",
	OTHER: "Other",
};

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
	ELECTRICITY: "Electricity bill",
	WATER: "Water bill",
	INTERNET: "Internet bill",
};

type GenerateUtilityPaymentsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bookingId: number;
};

type UtilityTypeLiteral = "ELECTRICITY" | "WATER" | "INTERNET" | "OTHER";

type ItemValue = {
	utilityType: UtilityTypeLiteral;
	amount: number;
	description: string;
};

const fullSchema = z.object({
	items: z.array(
		z.object({
			utilityType: z.enum(["ELECTRICITY", "WATER", "INTERNET", "OTHER"]),
			amount: z.number().min(0, "Amount cannot be negative"),
			description: z.string().min(1, "Description is required"),
		}),
	),
	paymentMethod: z.enum(["CASH", "GCASH", "BANK_TRANSFER"]),
	referenceNumber: z.string(),
});

function buildDefaultItems(existingUtilities: Set<string>): Array<ItemValue> {
	return MAIN_UTILITY_TYPES.map((type) => {
		const exists = existingUtilities.has(type);
		return {
			utilityType: type,
			amount: 0,
			description: exists ? "" : (DEFAULT_DESCRIPTIONS[type] ?? ""),
		};
	});
}

export function GenerateUtilityPaymentsDialog({
	open,
	onOpenChange,
	bookingId,
}: GenerateUtilityPaymentsDialogProps) {
	const queryClient = useQueryClient();
	const mutation = useMutation(
		ledgerMutations.generateUtilityPayments(queryClient, bookingId),
	);

	const { data: transactions = [] } = useSuspenseQuery(
		ledgerQueries.transactions(bookingId),
	);

	const existingUtilityTypes = useMemo(() => {
		const set = new Set<string>();
		for (const tx of transactions) {
			if (tx.category === "UTILITY" && tx.utilityType) {
				set.add(tx.utilityType);
			}
		}
		return set;
	}, [transactions]);

	const formOpts = formOptions({
		defaultValues: {
			items: buildDefaultItems(existingUtilityTypes) as Array<ItemValue>,
			paymentMethod: "CASH" as "CASH" | "GCASH" | "BANK_TRANSFER",
			referenceNumber: "",
		},
	});

	const form = useAppForm({
		...formOpts,
		...dynamicSchemaValidators(fullSchema),
		onSubmit: async ({ value }) => {
			try {
				const result = await mutation.mutateAsync({
					bookingId,
					items: value.items,
					paymentMethod: value.paymentMethod,
					referenceNumber: value.referenceNumber,
				});
				if (result.inserted === 0) {
					toast.info("No new utility payments to generate", {
						description: "All selected utilities already exist.",
					});
				} else {
					toast.success(
						`Generated ${result.inserted} utility payment${result.inserted === 1 ? "" : "s"}`,
					);
				}
				onOpenChange(false);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to generate utility payments";
				toast.error("Cannot generate utility payments", {
					description: message,
				});
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				items: buildDefaultItems(existingUtilityTypes),
				paymentMethod: "CASH",
				referenceNumber: "",
			});
		}
	}, [open, existingUtilityTypes, form]);

	const total = form.store.state.values.items.reduce(
		(sum, i) => sum + (Number.isFinite(i.amount) ? i.amount : 0),
		0,
	);

	const paymentMethod = useSelector(
		form.store,
		(state) => state.values.paymentMethod,
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogOutsideScroll className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Generate utility payments</DialogTitle>
				</DialogHeader>
				<form
					className="space-y-4 py-2"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.AppForm>
						<p className="text-sm text-muted-foreground">
							Utility charges for the current billing period. Missing utilities
							are pre-filled. Existing utilities are locked and already paid.
						</p>

						<div className="space-y-3">
							{form.store.state.values.items.map((item, index) => {
								const exists = existingUtilityTypes.has(item.utilityType);
								return (
									<div
										key={item.utilityType}
										className="rounded-md border bg-card p-3 space-y-2"
									>
										<div className="flex items-center justify-between">
											<span className="font-medium text-sm">
												{UTILITY_TYPE_LABELS[item.utilityType] ??
													item.utilityType}
											</span>
											{exists && (
												<span className="text-xs text-muted-foreground">
													Already generated
												</span>
											)}
										</div>

										{exists ? (
											<p className="text-xs text-muted-foreground">
												Amount:{" "}
												{formatPeso(
													Number(
														transactions.find(
															(t) =>
																t.utilityType === item.utilityType &&
																t.category === "UTILITY",
														)?.amount ?? 0,
													),
												)}
											</p>
										) : (
											<>
												<form.AppField name={`items[${index}].amount`}>
													{(field) => (
														<field.NumberField
															label="Amount"
															placeholder="0.00"
															min={0}
														/>
													)}
												</form.AppField>
												<form.AppField name={`items[${index}].description`}>
													{(field) => (
														<field.TextField
															label="Description"
															placeholder="e.g. Electricity bill"
														/>
													)}
												</form.AppField>
											</>
										)}
									</div>
								);
							})}
						</div>

						<div className="space-y-3 rounded-md border p-3">
							<p className="text-sm font-medium">Payment</p>
							<form.AppField name="paymentMethod">
								{(field) => (
									<field.RadioChoiceCardField
										label="Payment method"
										options={[...paymentMethodOptions]}
										onValueChange={(method: string) => {
											if (method === "CASH") {
												form.setFieldValue("referenceNumber", "");
											}
										}}
									/>
								)}
							</form.AppField>
							<form.AppField name="referenceNumber">
								{(field) => (
									<field.TextField
										label="Reference number"
										placeholder="e.g. GCash-1234567890"
										description="Required for GCash and bank transfer"
										disabled={paymentMethod === "CASH"}
									/>
								)}
							</form.AppField>
						</div>

						<div className="rounded-md border bg-muted/40 p-3 text-sm">
							<div className="flex justify-between font-semibold">
								<span>Total to be generated</span>
								<span>{formatPeso(total)}</span>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								type="button"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<form.SubmitButton label="Generate payments" />
						</DialogFooter>
					</form.AppForm>
				</form>
			</DialogOutsideScroll>
		</Dialog>
	);
}
