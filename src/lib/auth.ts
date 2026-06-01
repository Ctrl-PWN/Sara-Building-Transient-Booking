import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { admin } from 'better-auth/plugins'

import { db } from '@/db/index.ts'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: true,
      },
      lastName: {
        type: 'string',
        required: true,
      },
      phone: {
        type: 'string',
        required: false,
        input: true,
      },
      role: {
        type: ['ADMIN', 'STAFF'], // enum in Better Auth — not type: 'string'
        defaultValue: 'STAFF',
        required: true,
        input: true, // don’t let signup body set role
      },
      isActive: {
        type: 'boolean',
        defaultValue: true,
        input: false,
      },
    },
  },
  plugins: [
    admin({ defaultRole: 'STAFF', adminRoles: ['ADMIN'] }),
    tanstackStartCookies(),
  ],
})
