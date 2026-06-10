import { MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import Fuse from 'fuse.js'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateUserSheet } from '@/components/users/CreateUserSheet'
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog'
import { EditUserSheet } from '@/components/users/EditUserSheet'
import { UserTable } from '@/components/users/UserTable'
import { userQueries } from '@/lib/users/users.queries'

export const Route = createFileRoute('/_authenticated/_admin/user-management/')(
  {
    component: UsersPage,
  },
)

function UsersPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<{
    id: string
    name: string
    firstName?: string
    lastName?: string
    email: string
    role?: string
  } | null>(null)
  const [deleteUser, setDeleteUser] = useState<{
    id: string
    name: string
  } | null>(null)

  const { data: users, isLoading } = useQuery(userQueries.list())

  const itemList = users ?? []
  const filtered = !search
    ? itemList
    : search.length < 2
      ? itemList.filter((u) => {
          const user = u as {
            firstName?: string
            lastName?: string
            email: string
          }
          return (
            (user.firstName ?? '')
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            (user.lastName ?? '')
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
          )
        })
      : new Fuse(itemList, {
          keys: ['firstName', 'lastName', 'email'],
          threshold: 0.2,
        })
          .search(search)
          .map((r) => r.item)

  return (
    <main className="page-wrap flex flex-col gap-8 px-4 py-6 pb-8">
      <PageHeader
        title="Users"
        description="Staff account management for administrators."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            New user
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <section className="block-card overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <UserTable
            users={filtered}
            onEdit={(user) => setEditUser(user)}
            onDelete={(user) => setDeleteUser(user)}
          />
        )}
      </section>

      <CreateUserSheet open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserSheet
        user={editUser}
        open={editUser !== null}
        onOpenChange={(o) => {
          if (!o) setEditUser(null)
        }}
      />
      <DeleteUserDialog
        user={deleteUser}
        open={deleteUser !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteUser(null)
        }}
      />
    </main>
  )
}
