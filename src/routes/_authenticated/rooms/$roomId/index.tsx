import { createFileRoute, Link } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'

export const Route = createFileRoute('/_authenticated/rooms/$roomId/')({
  component: RoomDetailPage,
})

function RoomDetailPage() {
  const { roomId } = Route.useParams()

  return (
    <main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
      <PageHeader
        title={`Room ${roomId}`}
        description="Core room information and current operational status."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/rooms" className="btn-secondary no-underline text-sm">
              Back to list
            </Link>
            <Link
              to="/rooms/$roomId/history"
              params={{ roomId }}
              className="btn-primary no-underline text-sm"
            >
              View history
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Type', '—'],
          ['Capacity', '—'],
          ['Status', '—'],
          ['Base price', '—'],
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
        title="Room operations"
        description="Status updates and editing flows will be added in room feature tasks."
      />
    </main>
  )
}
