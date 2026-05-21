import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<main className="page-wrap px-4 py-12">
			<section className="block-card p-6 sm:p-8">
				<p className="font-body text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface-variant)] mb-2">
					About
				</p>
				<h1 className="font-display text-4xl font-bold text-[var(--on-surface)] sm:text-5xl">
					A small starter with room to grow.
				</h1>
				<p className="mt-4 max-w-3xl font-body text-lg leading-8 text-[var(--on-surface-variant)]">
					TanStack Start gives you type-safe routing, server functions, and
					modern SSR defaults. Use this as a clean foundation, then layer in
					your own routes, styling, and add-ons.
				</p>
			</section>
		</main>
	);
}
