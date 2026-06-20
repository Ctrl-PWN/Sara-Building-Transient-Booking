import { formatReceiptAmount, type ReceiptModel } from "./receipt-model";

const PREVIEW_WIDTH_PX = 204;

type ReceiptPreviewProps = {
	receipt: ReceiptModel;
	className?: string;
};

function Divider({ thick = false }: { thick?: boolean }) {
	return (
		<hr
			className={
				thick
					? "my-1.5 border-0 border-t-[1.5px] border-black"
					: "my-1 border-0 border-t border-black"
			}
		/>
	);
}

export function ReceiptPreview({ receipt, className }: ReceiptPreviewProps) {
	return (
		<div
			className={`mx-auto shrink-0 overflow-hidden rounded-sm border border-border bg-white px-2 py-3 font-mono text-[9px] leading-snug text-black shadow-sm ${className ?? ""}`}
			style={{ width: PREVIEW_WIDTH_PX }}
		>
			<div className="text-center">
				<p className="text-[11px] font-bold tracking-wide">SARA BUILDING</p>
				<p className="text-[11px] font-bold tracking-wide">TRANSIENT</p>
				<p className="text-[8px] text-gray-500">Guest House · Ledger</p>
			</div>

			<Divider thick />
			<p className="text-center text-[10px] font-bold tracking-wide">
				{receipt.documentTitle} {receipt.documentRef}
			</p>
			<Divider />

			<div className="space-y-0.5">
				{receipt.kvRows.map((row) => (
					<div
						key={`${row.label}-${row.value}`}
						className="flex justify-between gap-2"
					>
						<span className="shrink-0 text-gray-500">{row.label}</span>
						<span className="text-right font-medium">{row.value}</span>
					</div>
				))}
			</div>

			<Divider />
			<p className="text-center text-[8px] font-bold tracking-wide text-gray-500">
				CHARGES
			</p>
			<Divider />

			{receipt.lineItems.length === 0 ? (
				<p className="text-center text-[8px] text-gray-500">No charges.</p>
			) : (
				<div className="space-y-2">
					{receipt.lineItems.map((item) => (
						<div key={item.id}>
							<p className="font-semibold">{item.label}</p>
							{item.meta ? (
								<p className="text-[8px] text-gray-500">{item.meta}</p>
							) : null}
							<div className="mt-0.5 flex items-center justify-between">
								<span className="font-bold">
									{formatReceiptAmount(item.amount)}
								</span>
								{item.isPaid !== undefined ? (
									<span
										className={
											item.isPaid
												? "rounded bg-black px-1 py-px text-[7px] font-medium text-white"
												: "rounded border border-black px-1 py-px text-[7px] font-medium"
										}
									>
										{item.isPaid ? "PAID" : "UNPAID"}
									</span>
								) : null}
							</div>
						</div>
					))}
				</div>
			)}

			<Divider thick />

			<div className="space-y-0.5">
				{receipt.totals.totalCharges !== undefined ? (
					<div className="flex justify-between">
						<span className="text-gray-500">Total charges</span>
						<span>{formatReceiptAmount(receipt.totals.totalCharges)}</span>
					</div>
				) : null}
				{receipt.totals.totalPaid !== undefined ? (
					<div className="flex justify-between">
						<span className="text-gray-500">Total paid</span>
						<span>{formatReceiptAmount(receipt.totals.totalPaid)}</span>
					</div>
				) : null}
				<div className="flex justify-between pt-1 font-bold">
					<span>{receipt.totals.balanceLabel ?? "TOTAL DUE"}</span>
					<span>{formatReceiptAmount(receipt.totals.totalDue)}</span>
				</div>
			</div>

			{receipt.footerText ? (
				<>
					<Divider />
					<p className="text-center text-[8px] text-gray-500">
						{receipt.footerText}
					</p>
				</>
			) : null}
		</div>
	);
}

export { PREVIEW_WIDTH_PX };
