import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/session/session.functions'

export const Route = createFileRoute('/_authenticated/_admin')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user.role !== 'admin') {
      throw redirect({ to: '/' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return <Outlet />
}
