import { createFileRoute, Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'

export const Route = createFileRoute('/_authenticated/bookings/')({
  component: BookingsListPage,
})

function BookingsListPage() {
  return (
    <main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
      <PageHeader
        title="Bookings"
        description="View and manage guest reservations."
      />

      <section className="block-card overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Ref
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Guest
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Room
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-4 py-3">
                <Link
                  to="/bookings/$bookingId"
                  params={{ bookingId: 'sample-001' }}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  sample-001
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">Sample Guest</td>
              <td className="px-4 py-3 text-muted-foreground">101</td>
              <td className="px-4 py-3 text-muted-foreground">Reserved</td>
            </tr>
          </tbody>
        </table>
      </section>

      <PlaceholderPanel
        title="Booking list"
        description="Live booking data and filters will be wired in CTR-17."
      />
    </main>
  )
}
