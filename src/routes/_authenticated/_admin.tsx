import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_admin')({
  component: AdminLayout,
})

function AdminLayout() {
  return <Outlet />
}
