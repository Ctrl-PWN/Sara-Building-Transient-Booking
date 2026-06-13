import { createMiddleware, createServerOnlyFn } from '@tanstack/react-start'

export const requireAdmin = createServerOnlyFn(async () => {
  const [{ auth }, { getRequestHeaders }] = await Promise.all([
    import('./auth'),
    import('@tanstack/react-start/server'),
  ])

  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })

  if (session?.user?.role !== 'admin') {
    throw new Response('Forbidden', {
      status: 403,
    })
  }

  return session
})

export function authMiddleware() {
  return createMiddleware().server(async ({ next }) => {
    await requireAdmin()
    return next()
  })
}
