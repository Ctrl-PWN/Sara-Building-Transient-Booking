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

    let users = result.users.filter((user) => user.role !== 'admin')

    if (data?.searchValue) {
      const value = data.searchValue.toLowerCase()
      users = users.filter((user) => {
        const firstName =
          typeof (user as any).firstName === 'string'
            ? (user as any).firstName.toLowerCase()
            : ''
        const lastName =
          typeof (user as any).lastName === 'string'
            ? (user as any).lastName.toLowerCase()
            : ''
        const name = user.name?.toLowerCase() ?? ''
        const email = user.email?.toLowerCase() ?? ''
        return (
          firstName.includes(value) ||
          lastName.includes(value) ||
          name.includes(value) ||
          email.includes(value)
        )
      })
    }

    return users
  })

export const createUser = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware()])
  .inputValidator(createUserSchema)
  .handler(async ({ data }) => {
    const { auth, headers } = await getAuthRequestContext()
    const name = `${data.firstName} ${data.lastName}`.trim()

    const body = {
      email: data.email,
      name,
      password: data.password,
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
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

    if (
      typeof data.data.firstName === 'string' &&
      data.data.firstName.trim() === ''
    ) {
      throw new Error('First name cannot be blank')
    }
    if (
      typeof data.data.lastName === 'string' &&
      data.data.lastName.trim() === ''
    ) {
      throw new Error('Last name cannot be blank')
    }

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
