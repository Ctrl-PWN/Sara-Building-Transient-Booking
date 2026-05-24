import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<section className="block-card overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
				<p className="font-body text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface-variant)] mb-3">
					Property Management Platform
				</p>
				<h1 className="font-display text-4xl leading-[1.1] font-bold tracking-tight text-[var(--on-surface)] sm:text-5xl max-w-3xl">
					Block Center
				</h1>
				<p className="mt-4 max-w-2xl font-body text-lg text-[var(--on-surface-variant)]">
					Transient booking management for Sara Building. Monitor availability,
					reservations, and occupancy across all units.
				</p>

				<div className="mt-8 flex flex-wrap gap-3">
					<a href="/about" className="btn-primary no-underline">
						View Dashboard
					</a>
					<a
						href="https://tanstack.com/router"
						target="_blank"
						rel="noopener noreferrer"
						className="btn-secondary no-underline"
					>
						Documentation
					</a>
				</div>

				<div className="mt-8 flex flex-wrap gap-3">
					<span className="status-chip">
						<span className="h-2 w-2 rounded-full bg-[var(--status-available)]" />
						Available
					</span>
					<span className="status-chip">
						<span className="h-2 w-2 rounded-full bg-[var(--status-reserved)]" />
						Reserved
					</span>
					<span className="status-chip">
						<span className="h-2 w-2 rounded-full bg-[var(--status-occupied)]" />
						Occupied
					</span>
					<span className="status-chip">
						<span className="h-2 w-2 rounded-full bg-[var(--status-maintenance)]" />
						Maintenance
					</span>
				</div>
			</section>

			<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[
					["24", "Total Units", "data"],
					["18", "Available", "status-available"],
					["4", "Occupied", "status-occupied"],
					["2", "Maintenance", "status-maintenance"],
				].map(([value, label, _colorVar]) => (
					<article key={label} className="block-card p-5">
						<p className="font-body text-3xl font-medium tracking-tight text-[var(--on-surface)] m-0">
							{value}
						</p>
						<p className="mt-2 font-body text-sm font-medium tracking-tight text-[var(--on-surface-variant)] m-0">
							{label}
						</p>
					</article>
				))}
			</section>

			<section className="block-card mt-8 p-6">
				<h2 className="font-display text-2xl font-semibold text-[var(--on-surface)] m-0">
					Getting Started
				</h2>
				<ul className="mt-4 space-y-2 pl-5 font-body text-sm text-[var(--on-surface-variant)]">
					<li>
						Edit <code>src/routes/index.tsx</code> to customize the dashboard.
					</li>
					<li>
						Update <code>src/components/Header.tsx</code> and{" "}
						<code>src/components/Footer.tsx</code> for brand links.
					</li>
					<li>
						Configure your database in <code>src/db/schema.ts</code> and{" "}
						<code>drizzle.config.ts</code>.
					</li>
				</ul>
			</section>
		</main>
	);
}
