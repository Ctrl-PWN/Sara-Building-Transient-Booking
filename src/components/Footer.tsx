export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-20 border-t border-[var(--outline)] px-4 pb-14 pt-10 text-[var(--on-surface-variant)] font-body">
			<div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
				<p className="m-0 text-sm">
					&copy; {year} Sara Building. All rights reserved.
				</p>
				<p className="m-0 font-body text-xs font-bold uppercase tracking-[0.05em]">
					Transient Booking System
				</p>
			</div>
		</footer>
	);
}
