import type { QueryClient } from '@tanstack/react-query'
import { mutationOptions } from '@tanstack/react-query'
import type { z } from 'zod'
import type {
  createUserSchema,
  deleteUserSchema,
  updateUserSchema,
} from './schemas'
import { createUser, deleteUser, updateUser } from './users.functions'
import { userKeys } from './users.queries'

export const userMutations = {
  create: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: z.infer<typeof createUserSchema>) =>
        createUser({ data: input }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: userKeys.all })
      },
    }),

  update: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: z.infer<typeof updateUserSchema>) =>
        updateUser({ data: input }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: userKeys.all })
      },
    }),

  delete: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: z.infer<typeof deleteUserSchema>) =>
        deleteUser({ data: input }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: userKeys.all })
      },
    }),
}
