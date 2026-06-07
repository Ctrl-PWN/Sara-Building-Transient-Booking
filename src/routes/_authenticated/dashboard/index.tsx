import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/PageHeader'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
      <PageHeader
        title="Dashboard"
        description="Monitor availability, reservations, and occupancy across all units."
      />

      <section className="block-card overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
        <p className="font-body text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface-variant)] mb-3">
          Property Management Platform
        </p>
        <p className="font-display text-3xl leading-[1.1] font-bold tracking-tight text-[var(--on-surface)] sm:text-4xl max-w-3xl">
          Block Center
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['24', 'Total Units'],
          ['18', 'Available'],
          ['4', 'Occupied'],
          ['2', 'Maintenance'],
        ].map(([value, label]) => (
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

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="block-card p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--on-surface)] m-0">
            Check-ins due today
          </h2>
          <p className="mt-2 font-body text-sm text-[var(--on-surface-variant)] m-0">
            No check-ins scheduled.
          </p>
        </article>
        <article className="block-card p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--on-surface)] m-0">
            Check-outs due today
          </h2>
          <p className="mt-2 font-body text-sm text-[var(--on-surface-variant)] m-0">
            No check-outs scheduled.
          </p>
        </article>
        <article className="block-card p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--on-surface)] m-0">
            Today
          </h2>
          <p className="mt-2 font-body text-sm text-[var(--on-surface-variant)] m-0">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </article>
        <article className="block-card p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--on-surface)] m-0">
            Occupied rooms
          </h2>
          <p className="mt-2 font-body text-sm text-[var(--on-surface-variant)] m-0">
            4 rooms currently occupied.
          </p>
        </article>
      </section>
    </main>
  )
}
