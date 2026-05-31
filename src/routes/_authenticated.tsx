import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { getSession } from '@/lib/session/session.functions'

export const Route = createFileRoute('/_authenticated')({
  loader: async () => {
    const session = await getSession()
    console.log('Session data:', session) // Debugging line to check session data
    if (!session) {
      throw redirect({ to: '/log-in' })
    }
  },
  component: AppShell,
})
