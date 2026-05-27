import { createFileRoute, Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'

export const Route = createFileRoute('/_authenticated/bookings/$bookingId')({
  component: BookingDetailPage,
})

function BookingDetailPage() {
  const { bookingId } = Route.useParams()

  return (
    <main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
      <PageHeader
        title={`Booking ${bookingId}`}
        description="Full booking information for operational review."
        actions={
          <Link to="/bookings" className="btn-secondary no-underline text-sm">
            Back to list
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ['Guest', '—'],
          ['Contact', '—'],
          ['Check-in', '—'],
          ['Check-out', '—'],
          ['Status', '—'],
          ['Payment', '—'],
        ].map(([label, value]) => (
          <section key={label} className="block-card p-5">
            <h2 className="font-body text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground m-0">
              {label}
            </h2>
            <p className="mt-2 font-body text-sm text-foreground m-0">
              {value}
            </p>
          </section>
        ))}
      </div>

      <PlaceholderPanel
        title="Booking actions"
        description="Status changes, check-out, and cancellation flows will be added in booking feature tasks."
      />
    </main>
  )
}
