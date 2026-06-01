import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel'

export const Route = createFileRoute('/_authenticated/_admin/user-management/')({
  component: UsersPage,
})

function UsersPage() {
  return (
    <main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
      <PageHeader
        title="Users"
        description="Staff account management for administrators."
      />

      <section className="block-card overflow-hidden">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                No users loaded yet.
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <PlaceholderPanel
        title="User management"
        description="Create, edit, and deactivate users will be added in CTR-12."
      />
    </main>
  )
}
