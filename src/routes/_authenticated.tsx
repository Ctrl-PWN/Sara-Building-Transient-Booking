import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()

    if (!data?.session) {
      throw redirect({ to: '/log-in' })
    }
  },
  component: AppShell,
})
