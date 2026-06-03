import { queryOptions } from '@tanstack/react-query'

import type { z } from 'zod'

import { listUsers } from './users.functions'
import type { listUsersSchema } from './schemas'

export const userKeys = {
  all: ['users'] as const,
  list: (filters?: z.infer<typeof listUsersSchema>) =>
    [...userKeys.all, 'list', filters] as const,
}

export const userQueries = {
  list: (filters?: z.infer<typeof listUsersSchema>) =>
    queryOptions({
      queryKey: userKeys.list(filters),
      queryFn: () => listUsers({ data: filters }),
      staleTime: 5 * 60_000,
    }),
}
