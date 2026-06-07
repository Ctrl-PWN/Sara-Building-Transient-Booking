import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '../auth'
import { authMiddleware } from '../require-admin'
import {
  createUserSchema,
  deleteUserSchema,
  listUsersSchema,
  updateUserSchema,
} from './schemas'

function normalizeUserNames<
  T extends { name: string; firstName?: string; lastName?: string },
>(user: T) {
  const parts = user.name.trim().split(/\s+/).filter(Boolean)
  const firstName = user.firstName?.trim() || parts[0] || ''
  const lastName = user.lastName?.trim() || parts.slice(1).join(' ') || ''
  return { ...user, firstName, lastName }
}

export const listUsers = createServerFn({
  method: 'GET',
})
  .middleware([authMiddleware()])
  .inputValidator(listUsersSchema.optional())
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const result = await auth.api.listUsers({
      query: data ?? {},
      headers,
    })

    let users = result.users
      .filter((user) => user.role !== 'admin')
      .map(normalizeUserNames)

    if (data?.searchValue) {
      const value = data.searchValue.toLowerCase()
      users = users.filter((user) => {
        const firstName =
          typeof user.firstName === 'string' ? user.firstName.toLowerCase() : ''
        const lastName =
          typeof user.lastName === 'string' ? user.lastName.toLowerCase() : ''
        const name =
          typeof user.name === 'string' ? user.name.toLowerCase() : ''
        const email =
          typeof user.email === 'string' ? user.email.toLowerCase() : ''
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

    const headers = getRequestHeaders()
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

    const updateData = { ...data.data }
    if (
      typeof updateData.firstName === 'string' ||
      typeof updateData.lastName === 'string'
    ) {
      const firstName =
        typeof updateData.firstName === 'string'
          ? updateData.firstName.trim()
          : undefined
      const lastName =
        typeof updateData.lastName === 'string'
          ? updateData.lastName.trim()
          : undefined
      if (firstName !== undefined || lastName !== undefined) {
        updateData.name = `${firstName ?? ''} ${lastName ?? ''}`.trim()
      }
    }

    const headers = getRequestHeaders()
    return auth.api.adminUpdateUser({
      body: { userId: data.userId, data: updateData },
      headers,
    })
  })

export const deleteUser = createServerFn({
  method: 'POST',
})
  .middleware([authMiddleware()])
  .inputValidator(deleteUserSchema)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    return auth.api.removeUser({
      body: {
        userId: data.userId,
      },
      headers,
    })
  })
