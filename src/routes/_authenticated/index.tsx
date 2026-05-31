import { getSession } from '@/lib/session/session.functions'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
  loader: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/dashboard', replace: true })
    }
  }
})
