import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import {
  createUserSchema,
  deleteUserSchema,
  listUsersSchema,
  updateUserSchema,
} from './schemas'
import { auth } from '@/lib/auth'
import { authMiddleware } from '../require-admin'

export const listUsers = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware()])
  .inputValidator(listUsersSchema.optional())
  .handler(async ({ data }) => {
    const result = await auth.api.listUsers({
      query: data ?? {},
      headers: getRequestHeaders(),
    })

    return result.users
  })

export const createUser = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware()])
  .inputValidator(createUserSchema)
  .handler(async ({ data }) => {
    const role: 'user' | 'admin' | undefined =
      data.role === 'ADMIN'
        ? 'admin'
        : data.role === 'STAFF'
          ? 'user'
          : undefined

    const body = {
      email: data.email,
      name: data.name,
      password: data.password,
      role,
      data: data.data,
    }

    return auth.api.createUser({
      body,
      headers: getRequestHeaders(),
    })
  })

export const updateUser = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware()])
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => {
    return auth.api.adminUpdateUser({
      body: data,
      headers: getRequestHeaders(),
    })
  })

export const deleteUser = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware()])
  .inputValidator(deleteUserSchema)
  .handler(async ({ data }) => {
    return auth.api.removeUser({
      body: {
        userId: data.userId,
      },
      headers: getRequestHeaders(),
    })
  })
