import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'

import {
  createUserSchema,
  deleteUserSchema,
  listUsersSchema,
  updateUserSchema,
} from './schemas'
import { authMiddleware } from '../require-admin'

const getAuthRequestContext = createServerOnlyFn(async () => {
  const [{ auth: authServer }, { getRequestHeaders }] = await Promise.all([
    import('@/lib/auth'),
    import('@tanstack/react-start/server'),
  ])

  return {
    auth: authServer,
    headers: getRequestHeaders(),
  }
})

export const listUsers = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware()])
  .inputValidator(listUsersSchema.optional())
  .handler(async ({ data }) => {
    const { auth, headers } = await getAuthRequestContext()
    const result = await auth.api.listUsers({
      query: data ?? {},
      headers,
    })

    return result.users
  })

export const createUser = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware()])
  .inputValidator(createUserSchema)
  .handler(async ({ data }) => {
    const { auth, headers } = await getAuthRequestContext()
    const role: 'user' | 'admin' = data.role === 'ADMIN' ? 'admin' : 'user'
    const name = `${data.firstName} ${data.lastName}`.trim()

    const body = {
      email: data.email,
      name,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      role,
      data: data.data,
    }

    return auth.api.createUser({
      body,
      headers,
    })
  })

export const updateUser = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware()])
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => {
    const { auth, headers } = await getAuthRequestContext()
    return auth.api.adminUpdateUser({
      body: data,
      headers,
    })
  })

export const deleteUser = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware()])
  .inputValidator(deleteUserSchema)
  .handler(async ({ data }) => {
    const { auth, headers } = await getAuthRequestContext()
    return auth.api.removeUser({
      body: {
        userId: data.userId,
      },
      headers,
    })
  })
