import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth'

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Response('Forbidden', {
      status: 403,
    })
  }

  return session
}

export function authMiddleware() {
  return createMiddleware().server(async ({ next }) => {
    await requireAdmin()
    return next()
  })
}
